using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Text.Json;
using System.Windows;
using System.Windows.Input;

namespace SchoolManagement;

public partial class MainWindow : Window
{
    private const string DefaultServerUrl = "http://localhost:5173";
    private static readonly string OfflineCachePath =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                     "GIHM-HIS", "cache");
    private static readonly string ExeDir =
        Path.GetDirectoryName(Environment.ProcessPath)
        ?? Path.GetDirectoryName(Process.GetCurrentProcess().MainModule?.FileName)
        ?? AppContext.BaseDirectory;
    private static readonly string BundledDistPath = Path.Combine(ExeDir, "web-dist");
    private static readonly string SettingsPath =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                     "GIHM-HIS", "settings.json");

    private string _selectedMode = "";
    private string _authToken = "";
    private string _userEmail = "";
    private SystemWindow? _systemWindow;

    public MainWindow()
    {
        InitializeComponent();
        LoadIcons();
        LoadSettings();
        CalculateCacheSize();
    }

    private void LoadIcons()
    {
        try
        {
            var iconPath = Path.Combine(ExeDir, "assets", "icon.ico");
            if (File.Exists(iconPath))
                this.Icon = new System.Windows.Media.Imaging.BitmapImage(new Uri(iconPath));
            var logoPath = Path.Combine(ExeDir, "assets", "app-icon.png");
            if (File.Exists(logoPath))
            {
                var logo = new System.Windows.Media.Imaging.BitmapImage(new Uri(logoPath));
                LogoImage.Source = logo;
            }
        }
        catch { }
    }

    private void LoadSettings()
    {
        try
        {
            if (File.Exists(SettingsPath))
            {
                var json = File.ReadAllText(SettingsPath);
                var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("serverUrl", out var url))
                {
                    var saved = url.GetString();
                    // Only load valid URLs (never gihm.vercel.app or other wrong URLs)
                    if (!string.IsNullOrEmpty(saved) && !saved.Contains("gihm.vercel.app"))
                        ServerUrlBox.Text = saved;
                }
                if (doc.RootElement.TryGetProperty("autoSync", out var sync))
                    AutoSyncCheck.IsChecked = sync.GetBoolean();
            }
        }
        catch { }
    }

    private void SaveSettings()
    {
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(SettingsPath)!);
            File.WriteAllText(SettingsPath, JsonSerializer.Serialize(new
            {
                serverUrl = ServerUrlBox.Text.Trim(),
                autoSync = AutoSyncCheck.IsChecked == true,
                mode = _selectedMode,
                email = _userEmail
            }));
        }
        catch { }
    }

    private void CalculateCacheSize()
    {
        try
        {
            if (Directory.Exists(OfflineCachePath))
            {
                long totalBytes = 0;
                foreach (var file in Directory.GetFiles(OfflineCachePath, "*", SearchOption.AllDirectories))
                    totalBytes += new FileInfo(file).Length;
                CacheSizeText.Text = totalBytes < 1024 * 1024
                    ? $"Cache size: {totalBytes / 1024} KB"
                    : $"Cache size: {totalBytes / (1024 * 1024)} MB";
            }
            else CacheSizeText.Text = "Cache size: 0 KB (empty)";
        }
        catch { CacheSizeText.Text = "Cache size: unknown"; }
    }

    // ═══ HOVER EFFECTS ═══
    private void OfflineBtn_Enter(object sender, MouseEventArgs e) =>
        ((System.Windows.Controls.Border)sender).Background =
            new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(0x14, 0x20, 0x30));
    private void OfflineBtn_Leave(object sender, MouseEventArgs e) =>
        ((System.Windows.Controls.Border)sender).Background =
            new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(0x0A, 0x14, 0x24));
    private void ModeCard_Enter(object sender, MouseEventArgs e) =>
        ((System.Windows.Controls.Border)sender).BorderBrush =
            new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(0x30, 0x50, 0x80));
    private void ModeCard_Leave(object sender, MouseEventArgs e) =>
        ((System.Windows.Controls.Border)sender).BorderBrush =
            new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(0x1E, 0x30, 0x50));
    private void SettingsBtn_Enter(object sender, MouseEventArgs e)
    { if (sender is System.Windows.Controls.TextBlock t) t.Foreground = new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(0xAA, 0xBB, 0xCC)); }
    private void SettingsBtn_Leave(object sender, MouseEventArgs e)
    { if (sender is System.Windows.Controls.TextBlock t) t.Foreground = new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(0x66, 0x77, 0x88)); }

    // ═══ WINDOW CLOSING ═══
    private void MainWindow_Closing(object? sender, System.ComponentModel.CancelEventArgs e)
    {
        // Close system window if open
        try { _systemWindow?.Close(); } catch { }
    }

    // ═══ NAVIGATION ═══
    private void Settings_Click(object sender, MouseButtonEventArgs e)
    {
        LoginPanel.Visibility = Visibility.Collapsed;
        ModePanel.Visibility = Visibility.Collapsed;
        SettingsPanel.Visibility = Visibility.Visible;
    }

    private void SettingsBack_Click(object sender, RoutedEventArgs e)
    {
        SaveSettings();
        SettingsPanel.Visibility = Visibility.Collapsed;
        LoginPanel.Visibility = Visibility.Visible;
    }

    private void BackToLogin_Click(object sender, MouseButtonEventArgs e)
    {
        LoginPanel.Visibility = Visibility.Visible;
        ModePanel.Visibility = Visibility.Collapsed;
        ErrorText.Visibility = Visibility.Collapsed;
    }

    private void ClearCache_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            if (Directory.Exists(OfflineCachePath))
            {
                Directory.Delete(OfflineCachePath, true);
                MessageBox.Show("Cache cleared successfully.", "GIHM-HIS", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            CalculateCacheSize();
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Failed to clear cache: {ex.Message}", "GIHM-HIS", MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }

    // ═══ LOGIN ═══
    private async void SignIn_Click(object sender, RoutedEventArgs e)
    {
        var email = EmailBox.Text.Trim();
        var password = PasswordBox.Password;
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
        { ShowError("Please enter email and password."); return; }

        SignInButton.IsEnabled = false;
        SignInButton.Content = "Signing in…";
        ErrorText.Visibility = Visibility.Collapsed;

        var serverUrl = ServerUrlBox.Text.Trim();
        if (string.IsNullOrEmpty(serverUrl)) serverUrl = DefaultServerUrl;

        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
            var body = JsonSerializer.Serialize(new { email, password });
            var content = new StringContent(body, System.Text.Encoding.UTF8, "application/json");
            var resp = await http.PostAsync($"{serverUrl}/api/v1/auth/login", content);
            var json = await resp.Content.ReadAsStringAsync();
            if (resp.IsSuccessStatusCode)
            {
                var doc = JsonDocument.Parse(json);
                _authToken = doc.RootElement.GetProperty("token").GetString() ?? "";
                _userEmail = email;
                SaveSettings();
                ShowModeSelector();
                return;
            }
        }
        catch { }

        if (TryDemoLogin(email, password)) { SaveSettings(); ShowModeSelector(); return; }

        ShowError("Invalid credentials. Try demo: admin@demo.gh / Demo@123");
        SignInButton.IsEnabled = true;
        SignInButton.Content = "Sign in";
    }

    private void OfflineLogin_Click(object sender, MouseButtonEventArgs e)
    {
        _authToken = $"offline-token-{DateTime.Now.Ticks}";
        _userEmail = "admin@demo.gh";
        _selectedMode = "offline";
        SaveSettings();
        OpenSystemWindow();
    }

    private bool TryDemoLogin(string email, string password)
    {
        var demoUsers = new Dictionary<string, string>
        {
            ["admin@demo.gh"] = "Demo@123", ["hospital@demo.gh"] = "Demo@123",
            ["doctor@demo.gh"] = "Demo@123", ["nurse@demo.gh"] = "Demo@123",
            ["pharmacist@demo.gh"] = "Demo@123", ["lab@demo.gh"] = "Demo@123",
            ["patient@demo.gh"] = "Demo@123", ["regional@demo.gh"] = "Demo@123",
            ["district@demo.gh"] = "Demo@123", ["cashier@demo.gh"] = "Demo@123",
            ["private-admin@demo.gh"] = "Demo@123",
            ["shacomputec"] = "shacomputecgh@kobina5251",
        };
        if (demoUsers.TryGetValue(email, out var correctPass) && password == correctPass)
        { _authToken = $"demo-token-{DateTime.Now.Ticks}"; _userEmail = email; return true; }
        return false;
    }

    private void ShowModeSelector()
    {
        LoginPanel.Visibility = Visibility.Collapsed;
        SettingsPanel.Visibility = Visibility.Collapsed;
        ModePanel.Visibility = Visibility.Visible;
        WelcomeText.Text = $"Signed in as {_userEmail}";
        SignInButton.IsEnabled = true;
        SignInButton.Content = "Sign in";
    }

    // ═══ MODE SELECTION — opens NEW window, login stays open ═══
    private void ModeOnline_Click(object sender, MouseButtonEventArgs e)
    {
        _selectedMode = "online";
        SaveSettings();
        OpenSystemWindow();
    }

    private void ModeOffline_Click(object sender, MouseButtonEventArgs e)
    {
        _selectedMode = "offline";
        SaveSettings();
        OpenSystemWindow();
    }

    private void OpenSystemWindow()
    {
        try
        {
            var serverUrl = ServerUrlBox.Text.Trim();
            if (string.IsNullOrEmpty(serverUrl)) serverUrl = DefaultServerUrl;

            // Validate offline has bundled files
            if (_selectedMode == "offline" && !HasBundledDist())
            {
                ShowModeSelector();
                ShowError("Offline mode requires bundled web files. Please reinstall or use Online mode.");
                return;
            }

            // If system window already open, close it and open a fresh one
            try { _systemWindow?.Close(); } catch { }

            _systemWindow = new SystemWindow(_selectedMode, _authToken, _userEmail, serverUrl);
            _systemWindow.Show();

            Log($"Opened system window in {_selectedMode} mode");

            // Reset mode status on login screen
            ModeStatusText.Text = _selectedMode == "online"
                ? "✓ System opened in Online mode"
                : "✓ System opened in Offline mode";
        }
        catch (Exception ex)
        {
            ShowError($"Failed to open system:\n\n{ex.Message}\n\nMake sure WebView2 Runtime is installed.");
        }
    }

    // ═══ HELPERS ═══
    private void ShowError(string msg) { ErrorText.Text = msg; ErrorText.Visibility = Visibility.Visible; }
    private static bool HasBundledDist() =>
        Directory.Exists(BundledDistPath) && File.Exists(Path.Combine(BundledDistPath, "index.html"));

    private static void Log(string msg)
    {
        try
        {
            var logPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "GIHM-HIS", "app.log");
            Directory.CreateDirectory(Path.GetDirectoryName(logPath)!);
            File.AppendAllText(logPath, $"[{DateTime.Now:HH:mm:ss}] {msg}\n");
        }
        catch { }
    }
}
