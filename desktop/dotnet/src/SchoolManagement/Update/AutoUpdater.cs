using System;
using System.IO;
using System.Net.Http;
using System.Reflection;
using System.Security.Cryptography;
using System.Threading.Tasks;
using System.Windows;
using Newtonsoft.Json.Linq;

namespace SchoolManagement.Update;

/// <summary>
/// Lightweight auto-updater: fetches latest.json, verifies SHA-256, downloads new .exe.
/// </summary>
public sealed class AutoUpdater
{
    private static readonly HttpClient Http = new();

    public static async Task CheckForUpdateAsync(string manifestUrl)
    {
        try
        {
            var json = await Http.GetStringAsync(manifestUrl);
            var manifest = JObject.Parse(json);

            var latestVersion = manifest["version"]?.ToString();
            var downloadUrl = manifest["url"]?.ToString();
            var expectedHash = manifest["sha256"]?.ToString();
            var releaseNotes = manifest["releaseNotes"]?.ToString();

            var currentVersion = Assembly.GetEntryAssembly()?.GetName().Version;
            if (latestVersion == null || downloadUrl == null || expectedHash == null)
                return;

            var latest = new Version(latestVersion);
            if (currentVersion != null && latest <= currentVersion)
                return;

            var result = MessageBox.Show(
                $"Update available: v{latestVersion}\n\n{(string.IsNullOrEmpty(releaseNotes) ? "" : releaseNotes + "\n\n")}Download and install now?",
                "GIHM-HIS Update",
                MessageBoxButton.YesNo, MessageBoxImage.Information);

            if (result != MessageBoxResult.Yes) return;

            var tempPath = Path.Combine(Path.GetTempPath(), $"GIHM-HIS-{latestVersion}.exe");
            var bytes = await Http.GetByteArrayAsync(downloadUrl);
            await File.WriteAllBytesAsync(tempPath, bytes);

            if (!string.Equals(ComputeSha256(tempPath), expectedHash, StringComparison.OrdinalIgnoreCase))
            {
                File.Delete(tempPath);
                MessageBox.Show(
                    "Update verification failed (SHA-256 mismatch). Aborted.",
                    "GIHM-HIS", MessageBoxButton.OK, MessageBoxImage.Error);
                return;
            }

            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(tempPath)
            {
                UseShellExecute = true
            });
            Application.Current.Shutdown();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Update check failed: {ex.Message}");
        }
    }

    private static string ComputeSha256(string filePath)
    {
        using var sha = SHA256.Create();
        using var stream = File.OpenRead(filePath);
        return Convert.ToHexString(sha.ComputeHash(stream)).ToLowerInvariant();
    }
}
