using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace SchoolManagement.Offline;

/// <summary>
/// AES-256-GCM offline cache encryption backed by Windows DPAPI.
/// Per-user key derivation ensures cached patient data stays device-bound.
/// </summary>
public sealed class OfflineCacheCryptor
{
    private const int KeySize = 32;   // 256 bits
    private const int NonceSize = 12; // 96 bits (GCM standard)
    private const int TagSize = 16;   // 128 bits

    private readonly byte[] _key;

    public OfflineCacheCryptor(string cacheDir)
    {
        var keyFile = Path.Combine(cacheDir, ".cache-key");
        if (File.Exists(keyFile))
        {
            _key = Unprotect(File.ReadAllBytes(keyFile));
        }
        else
        {
            _key = RandomNumberGenerator.GetBytes(KeySize);
            Directory.CreateDirectory(cacheDir);
            File.WriteAllBytes(keyFile, Protect(_key));
        }
    }

    public byte[] Encrypt(byte[] plaintext)
    {
        var nonce = RandomNumberGenerator.GetBytes(NonceSize);
        var ciphertext = new byte[plaintext.Length];
        var tag = new byte[TagSize];

        using var aes = new AesGcm(_key, TagSize);
        aes.Encrypt(nonce, plaintext, ciphertext, tag);

        var result = new byte[NonceSize + TagSize + ciphertext.Length];
        Buffer.BlockCopy(nonce, 0, result, 0, NonceSize);
        Buffer.BlockCopy(tag, 0, result, NonceSize, TagSize);
        Buffer.BlockCopy(ciphertext, 0, result, NonceSize + TagSize, ciphertext.Length);
        return result;
    }

    public byte[] Decrypt(byte[] payload)
    {
        var nonce = new byte[NonceSize];
        var tag = new byte[TagSize];
        var ciphertext = new byte[payload.Length - NonceSize - TagSize];

        Buffer.BlockCopy(payload, 0, nonce, 0, NonceSize);
        Buffer.BlockCopy(payload, NonceSize, tag, 0, TagSize);
        Buffer.BlockCopy(payload, NonceSize + TagSize, ciphertext, 0, ciphertext.Length);

        var plaintext = new byte[ciphertext.Length];
        using var aes = new AesGcm(_key, TagSize);
        aes.Decrypt(nonce, ciphertext, tag, plaintext);
        return plaintext;
    }

    public string EncryptString(string plain) =>
        Convert.ToBase64String(Encrypt(Encoding.UTF8.GetBytes(plain)));

    // ── DPAPI helpers ───────────────────────────────────────────

    private static byte[] Protect(byte[] data) =>
        System.Security.Cryptography.ProtectedData.Protect(
            data, null, System.Security.Cryptography.DataProtectionScope.CurrentUser);

    private static byte[] Unprotect(byte[] data) =>
        System.Security.Cryptography.ProtectedData.Unprotect(
            data, null, System.Security.Cryptography.DataProtectionScope.CurrentUser);
}
