using System;
using System.Diagnostics;
using System.IO;
using System.Windows;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;

namespace SchoolManagement;

public partial class SystemWindow : Window
{
    private static readonly string OfflineCachePath =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                     "GIHM-HIS", "cache");
    private static readonly string ExeDir =
        Path.GetDirectoryName(Environment.ProcessPath)
        ?? Path.GetDirectoryName(Process.GetCurrentProcess().MainModule?.FileName)
        ?? AppContext.BaseDirectory;
    private static readonly string BundledDistPath = Path.Combine(ExeDir, "web-dist");

    private readonly string _mode;
    private readonly string _token;
    private readonly string _user;
    private readonly string _serverUrl;

    public SystemWindow(string mode, string token, string user, string serverUrl)
    {
        InitializeComponent();
        _mode = mode;
        _token = token;
        _user = user;
        _serverUrl = serverUrl;

        ModeLabel.Text = mode == "online" ? "\U0001F310 Online" : "\U0001F4F4 Offline";
        UserLabel.Text = user;
        Title = $"GIHM-HIS — {(mode == "online" ? "\U0001F310 Online" : "\U0001F4F4 Offline")} — by ShaComputeC";
        LoadIcon();
    }

    private void LoadIcon()
    {
        try
        {
            var iconPath = Path.Combine(ExeDir, "assets", "icon.ico");
            if (File.Exists(iconPath))
                this.Icon = new System.Windows.Media.Imaging.BitmapImage(new Uri(iconPath));
        }
        catch { }
    }

    private void Window_Closing(object? sender, System.ComponentModel.CancelEventArgs e)
    {
        try { WebView.Dispose(); } catch { }
    }

    private async void Window_Loaded(object sender, RoutedEventArgs e)
    {
        try
        {
            var env = await CoreWebView2Environment.CreateAsync(null, OfflineCachePath,
                new CoreWebView2EnvironmentOptions());
            await WebView.EnsureCoreWebView2Async(env);

            // Map bundled web-dist as a virtual host so absolute paths like /assets/... work
            if (Directory.Exists(BundledDistPath))
            {
                WebView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                    "app.local", BundledDistPath,
                    CoreWebView2HostResourceAccessKind.Allow);
                Log($"Mapped app.local -> {BundledDistPath}");
            }

            // Map cache for IndexedDB persistence
            WebView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                "offline-cache", OfflineCachePath,
                CoreWebView2HostResourceAccessKind.Allow);

            // Open external links in default browser
            WebView.CoreWebView2.NewWindowRequested += (_, args) =>
            {
                args.Handled = true;
                try { Process.Start(new ProcessStartInfo(args.Uri) { UseShellExecute = true }); } catch { }
            };

            // Build the URL
            string url;
            if (_mode == "offline")
            {
                // Virtual host mapping: https://app.local/ maps to C:\GIHM-HIS\web-dist\
                // This makes /assets/... resolve to web-dist/assets/...
                url = $"https://app.local/index.html?appmode=offline&token={Uri.EscapeDataString(_token)}&user={Uri.EscapeDataString(_user)}";
            }
            else
            {
                // ONLINE: connect to the actual dev server
                url = $"{_serverUrl}?appmode=online&token={Uri.EscapeDataString(_token)}&user={Uri.EscapeDataString(_user)}";
            }

            Log($"SystemWindow navigating to: {url}");
            WebView.CoreWebView2.Navigate(url);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Failed to start system:\n{ex.Message}\n\nMake sure WebView2 Runtime is installed.",
                "GIHM-HIS", MessageBoxButton.OK, MessageBoxImage.Error);
            Close();
        }
    }

    private void WebView_CoreWebView2InitializationCompleted(object? sender,
        CoreWebView2InitializationCompletedEventArgs e)
    {
        if (!e.IsSuccess)
        {
            MessageBox.Show($"WebView2 init failed:\n{e.InitializationException.Message}",
                "GIHM-HIS", MessageBoxButton.OK, MessageBoxImage.Error);
            Close();
        }
    }

    private void WebView_NavigationStarting(object? sender, CoreWebView2NavigationStartingEventArgs e)
    {
        if (!string.IsNullOrEmpty(_token) && WebView.CoreWebView2 != null)
        {
            var escapedToken = _token.Replace("'", "\\'");
            var escapedUser = _user.Replace("'", "\\'");
            var escapedMode = _mode.Replace("'", "\\'");
            WebView.CoreWebView2.ExecuteScriptAsync(
                $"localStorage.setItem('gihm_token','{escapedToken}');" +
                $"localStorage.setItem('gihm_user_email','{escapedUser}');" +
                $"window.__APP_MODE='{escapedMode}';");
        }
    }

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
