using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace SchoolManagement.Setup;

internal static class Program
{
    private const string AppName = "GIHM-HIS";
    private const string AppExe = "GIHM-HIS.exe";
    private const string Developer = "ShaComputeC";
    private const string Version = "0.1.0";
    private static readonly string PrimaryDir = $@"C:\{AppName}";
    private static readonly string FallbackDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), AppName);
    private static readonly string UninstallExe = "GIHM-HIS-Uninstall.exe";
    private static readonly string RegistryKey = $@"Software\Microsoft\Windows\CurrentVersion\Uninstall\{AppName}";

    private static readonly string LogPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "GIHM-HIS-setup.log");

    private static void Log(string msg)
    {
        try { File.AppendAllText(LogPath, $"[{DateTime.Now:HH:mm:ss}] {msg}\n"); } catch { }
    }

    [STAThread]
    static void Main()
    {
        // Check if this is running as uninstaller
        var args = Environment.GetCommandLineArgs();
        if (args.Length > 1 && args[1] == "--uninstall")
        {
            RunUninstaller();
            return;
        }

        try { File.Delete(LogPath); } catch { }
        Log("Installer starting");

        var app = new Application { ShutdownMode = ShutdownMode.OnExplicitShutdown };

        // Build UI programmatically
        var progressBar = new ProgressBar
        {
            Height = 10, Minimum = 0, Maximum = 100, Value = 0,
            Foreground = new SolidColorBrush(Color.FromRgb(0xDC, 0x26, 0x26)),
            Background = new SolidColorBrush(Color.FromRgb(0x1E, 0x30, 0x50)),
            Margin = new Thickness(0, 0, 0, 8),
        };
        var fileLabel = new TextBlock
        {
            Text = "", Foreground = new SolidColorBrush(Color.FromRgb(0xAA, 0xBB, 0xCC)),
            FontSize = 10, TextWrapping = TextWrapping.Wrap,
            Margin = new Thickness(0, 0, 0, 4), MaxHeight = 40,
        };
        var pathLabel = new TextBlock
        {
            Text = "Preparing…", Foreground = new SolidColorBrush(Color.FromRgb(0x66, 0x77, 0x88)),
            FontSize = 11, Margin = new Thickness(0, 0, 0, 8),
        };
        var statusText = new TextBlock
        {
            Text = "Starting installation…", Foreground = new SolidColorBrush(Color.FromRgb(0xCC, 0xCC, 0xCC)),
            FontSize = 12,
        };
        var progressLabel = new TextBlock
        {
            Text = "0%", Foreground = new SolidColorBrush(Color.FromRgb(0xDC, 0x26, 0x26)),
            FontSize = 11, FontWeight = FontWeights.Bold,
            HorizontalAlignment = HorizontalAlignment.Right,
        };

        // Header with logo + developer name
        var header = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 0, 0, 16) };
        try
        {
            var logoPath = Path.Combine(AppContext.BaseDirectory, "assets", "app-icon.png");
            if (File.Exists(logoPath))
            {
                var bitmap = new System.Windows.Media.Imaging.BitmapImage(new Uri(logoPath));
                header.Children.Add(new Image { Source = bitmap, Width = 40, Height = 40, Margin = new Thickness(0, 0, 12, 0) });
            }
        }
        catch { }
        header.Children.Add(new StackPanel
        {
            Children =
            {
                new TextBlock { Text = AppName, Foreground = Brushes.White, FontSize = 20, FontWeight = FontWeights.Bold },
                new TextBlock { Text = $"by {Developer} — Ghana Integrated Health Management System",
                    Foreground = new SolidColorBrush(Color.FromRgb(0x88, 0x99, 0xAA)), FontSize = 11 },
            }
        });

        // Layout
        var grid = new Grid { Margin = new Thickness(30) };
        grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });  // header
        grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });  // path
        grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });  // progress bar
        grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });  // file label
        grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });  // status + %
        Grid.SetRow(header, 0); grid.Children.Add(header);
        Grid.SetRow(pathLabel, 1); grid.Children.Add(pathLabel);
        Grid.SetRow(progressBar, 2); grid.Children.Add(progressBar);
        Grid.SetRow(fileLabel, 3); grid.Children.Add(fileLabel);

        var statusRow = new Grid();
        statusRow.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
        statusRow.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
        Grid.SetColumn(statusText, 0); statusRow.Children.Add(statusText);
        Grid.SetColumn(progressLabel, 1); statusRow.Children.Add(progressLabel);
        Grid.SetRow(statusRow, 4); grid.Children.Add(statusRow);

        var window = new Window
        {
            Title = $"{AppName} Installer — by {Developer}",
            Width = 520, Height = 280,
            WindowStartupLocation = WindowStartupLocation.CenterScreen,
            WindowStyle = WindowStyle.SingleBorderWindow, ResizeMode = ResizeMode.NoResize,
            Background = new SolidColorBrush(Color.FromRgb(0x12, 0x20, 0x3a)),
            Content = grid,
        };

        window.ContentRendered += async (_, _) =>
        {
            Log("ContentRendered fired");
            try
            {
                string installDir;
                try
                {
                    Directory.CreateDirectory(PrimaryDir);
                    var testFile = Path.Combine(PrimaryDir, ".write-test");
                    File.WriteAllText(testFile, "test"); File.Delete(testFile);
                    installDir = PrimaryDir;
                }
                catch { installDir = FallbackDir; }
                Log($"installDir={installDir}");
                pathLabel.Text = $"Installing to: {installDir}";

                statusText.Text = "Preparing installation directory…";
                progressBar.Value = 5;
                Directory.CreateDirectory(installDir);
                await Task.Delay(300);

                // Extract ZIP payload with per-file progress
                statusText.Text = "Extracting application files…";
                progressBar.Value = 10;
                await Task.Delay(100);

                int fileCount = 0;
                int totalFiles = 0;
                long totalBytes = 0;
                long extractedBytes = 0;
                string currentFileName = "";

                var extractTask = Task.Run(() =>
                {
                    ExtractZipPayload(installDir, (fn, current, total, bytesExtracted, totalBytesTotal) =>
                    {
                        currentFileName = fn;
                        fileCount = current;
                        totalFiles = total;
                        extractedBytes = bytesExtracted;
                        totalBytes = totalBytesTotal;
                    });
                });

                while (!extractTask.IsCompleted)
                {
                    if (totalFiles > 0)
                    {
                        double pct = (double)fileCount / totalFiles * 80;
                        progressBar.Value = 10 + pct;
                        progressLabel.Text = $"{(int)(10 + pct)}%";
                        fileLabel.Text = $"[{fileCount}/{totalFiles}] {currentFileName}";
                    }
                    else
                    {
                        if (progressBar.Value < 50) progressBar.Value += 1;
                    }
                    await Task.Delay(50);
                }
                await extractTask;
                progressBar.Value = 90;
                progressLabel.Text = "90%";
                Log($"Extraction complete: {fileCount} files");
                fileLabel.Text = $"Extracted {fileCount} files";

                // Create uninstall.exe (copy of self with --uninstall flag)
                statusText.Text = "Creating uninstaller…";
                fileLabel.Text = "Setting up uninstaller for Control Panel…";
                await Task.Delay(100);
                CreateUninstallExecutable(installDir);
                Log("Uninstall.exe created");

                // Register in Windows Control Panel
                RegisterInControlPanel(installDir);
                Log("Registered in Control Panel");

                // Create shortcuts with developer name
                statusText.Text = "Creating shortcuts…";
                fileLabel.Text = "Creating Start Menu + Desktop shortcuts…";
                await Task.Delay(200);
                CreateStartMenuShortcut(installDir);
                CreateDesktopShortcut(installDir);
                Log("Shortcuts created");
                progressBar.Value = 95;
                progressLabel.Text = "95%";

                // Launch
                statusText.Text = $"Launching {AppName}…";
                fileLabel.Text = "";
                progressBar.Value = 98;
                await Task.Delay(300);

                var exePath = Path.Combine(installDir, AppExe);
                if (File.Exists(exePath))
                {
                    Log($"Launching {exePath}");
                    Process.Start(new ProcessStartInfo(exePath) { UseShellExecute = true });
                }

                progressBar.Value = 100;
                progressLabel.Text = "100%";
                statusText.Text = $"✅ Installation complete! {AppName} by {Developer}";
                fileLabel.Text = $"{fileCount} files installed to {installDir}";
                Log("DONE");
                await Task.Delay(2000);
                window.Close(); app.Shutdown();
            }
            catch (Exception ex)
            {
                Log($"ERROR: {ex}");
                statusText.Text = $"❌ {ex.Message}";
                fileLabel.Text = ex.ToString();
                progressBar.Value = 0;
            }
        };

        app.Run(window);
    }

    // ════════════════════════════════════════════════════════════
    //  UNINSTALLER
    // ════════════════════════════════════════════════════════════

    private static void RunUninstaller()
    {
        var app = new Application { ShutdownMode = ShutdownMode.OnExplicitShutdown };

        var result = MessageBox.Show(
            $"Are you sure you want to uninstall {AppName}?\n\n" +
            $"This will remove the application and all its data from your computer.\n\n" +
            $"Click OK to uninstall, or Cancel to keep it installed.",
            $"Uninstall {AppName}",
            MessageBoxButton.OKCancel, MessageBoxImage.Question);

        if (result != MessageBoxResult.OK)
            return;

        var statusText = new TextBlock
        {
            Text = "Uninstalling…", Foreground = Brushes.White, FontSize = 14,
            HorizontalAlignment = HorizontalAlignment.Center, VerticalAlignment = VerticalAlignment.Center,
        };

        var window = new Window
        {
            Title = $"Uninstalling {AppName}",
            Width = 400, Height = 150,
            WindowStartupLocation = WindowStartupLocation.CenterScreen,
            WindowStyle = WindowStyle.SingleBorderWindow, ResizeMode = ResizeMode.NoResize,
            Background = new SolidColorBrush(Color.FromRgb(0x12, 0x20, 0x3a)),
            Content = statusText,
        };

        window.ContentRendered += async (_, _) =>
        {
            try
            {
                // 1. Remove shortcuts
                RemoveShortcuts();

                // 2. Remove registry keys
                RemoveControlPanelEntry();

                // 3. Remove application data
                var appData = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), AppName);
                if (Directory.Exists(appData))
                {
                    try { Directory.Delete(appData, true); } catch { }
                }

                statusText.Text = "Removing application files…";
                await Task.Delay(500);

                // 4. Remove install directory (skip self)
                var installDir = Path.GetDirectoryName(Environment.ProcessPath);
                if (installDir != null && Directory.Exists(installDir))
                {
                    // Delete everything except ourselves
                    foreach (var file in Directory.GetFiles(installDir))
                    {
                        if (Path.GetFileName(file) == UninstallExe) continue;
                        try { File.Delete(file); } catch { }
                    }
                    foreach (var dir in Directory.GetDirectories(installDir))
                    {
                        try { Directory.Delete(dir, true); } catch { }
                    }
                }

                statusText.Text = "✅ Uninstall complete!";
                await Task.Delay(1000);

                // Delete ourselves last
                try
                {
                    var self = Environment.ProcessPath;
                    if (self != null)
                    {
                        // Schedule self-deletion via cmd
                        var psi = new ProcessStartInfo("cmd.exe",
                            $"/c timeout /t 2 /nobreak >nul & del /f /q \"{self}\" & rmdir /q \"{installDir}\"");
                        psi.WindowStyle = ProcessWindowStyle.Hidden;
                        psi.CreateNoWindow = true;
                        Process.Start(psi);
                    }
                }
                catch { }

                window.Close();
                app.Shutdown();
            }
            catch (Exception ex)
            {
                statusText.Text = $"❌ Error: {ex.Message}";
                await Task.Delay(3000);
                window.Close();
                app.Shutdown();
            }
        };

        app.Run(window);
    }

    private static void CreateUninstallExecutable(string installDir)
    {
        // Copy the installer exe as the uninstaller
        var selfPath = Environment.ProcessPath;
        if (selfPath == null) return;

        var uninstallPath = Path.Combine(installDir, UninstallExe);
        File.Copy(selfPath, uninstallPath, true);
        Log($"Copied installer to uninstaller: {uninstallPath}");
    }

    private static void RegisterInControlPanel(string installDir)
    {
        try
        {
            // Use HKCU (no admin required)
            using var key = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(RegistryKey);
            if (key != null)
            {
                key.SetValue("DisplayName", $"{AppName} by {Developer}");
                key.SetValue("DisplayVersion", Version);
                key.SetValue("Publisher", Developer);
                key.SetValue("InstallLocation", installDir);
                key.SetValue("UninstallString", $"\"{Path.Combine(installDir, UninstallExe)}\"");
                key.SetValue("QuietUninstallString", $"\"{Path.Combine(installDir, UninstallExe)}\" --uninstall");
                key.SetValue("InstallDate", DateTime.Now.ToString("yyyyMMdd"));
                key.SetValue("EstimatedSize", 140000); // KB — ~140MB
                key.SetValue("NoModify", 1);
                key.SetValue("NoRepair", 1);
                key.SetValue("URLInfoAbout", "https://gihm.vercel.app");
                key.SetValue("URLUpdateInfo", "https://gihm.vercel.app");

                // Set icon
                var iconPath = Path.Combine(installDir, "assets", "icon.ico");
                if (File.Exists(iconPath))
                    key.SetValue("DisplayIcon", iconPath);

                Log("Registry keys written to HKCU");
            }
        }
        catch (Exception ex)
        {
            Log($"Registry write failed: {ex.Message}");
        }
    }

    private static void RemoveControlPanelEntry()
    {
        try
        {
            Microsoft.Win32.Registry.CurrentUser.DeleteSubKey(RegistryKey, false);
            Log("Registry keys removed");
        }
        catch (Exception ex)
        {
            Log($"Registry removal failed: {ex.Message}");
        }
    }

    private static void RemoveShortcuts()
    {
        try
        {
            // Desktop shortcut
            var desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            var desktopShortcut = Path.Combine(desktop, $"{AppName} by {Developer}.lnk");
            if (File.Exists(desktopShortcut)) File.Delete(desktopShortcut);

            // Start Menu shortcuts
            var startMenu = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.StartMenu),
                "Programs", $"{AppName} by {Developer}");
            if (Directory.Exists(startMenu)) Directory.Delete(startMenu, true);

            Log("Shortcuts removed");
        }
        catch (Exception ex)
        {
            Log($"Shortcut removal failed: {ex.Message}");
        }
    }

    // ════════════════════════════════════════════════════════════
    //  ZIP EXTRACTION
    // ════════════════════════════════════════════════════════════

    private static void ExtractZipPayload(string targetDir, Action<string, int, int, long, long> onProgress)
    {
        var exePath = Environment.ProcessPath
            ?? Process.GetCurrentProcess().MainModule?.FileName
            ?? throw new InvalidOperationException("Cannot determine installer path.");
        Log($"ExtractZipPayload: exePath={exePath}, size={new FileInfo(exePath).Length}");

        var marker = Encoding.ASCII.GetBytes("GCM\0");
        using var fs = new FileStream(exePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        using var reader = new BinaryReader(fs);

        // Read marker at EOF
        fs.Seek(-marker.Length, SeekOrigin.End);
        var readMarker = reader.ReadBytes(marker.Length);
        Log($"EOF marker=[{string.Join(",", readMarker)}]");

        if (!BytesEqual(readMarker, marker))
        {
            throw new InvalidDataException("Payload marker not found at EOF");
        }

        // Read payload length (before marker)
        fs.Seek(-marker.Length - 4, SeekOrigin.End);
        var payloadLen = reader.ReadInt32();
        Log($"payloadLen={payloadLen} ({payloadLen / 1024 / 1024} MB)");

        // Read payload ZIP (before length field)
        fs.Seek(-marker.Length - 4 - payloadLen, SeekOrigin.End);
        var payload = reader.ReadBytes(payloadLen);

        // Extract ZIP
        using var zipStream = new MemoryStream(payload);
        using var archive = new ZipArchive(zipStream, ZipArchiveMode.Read);

        var entries = archive.Entries;
        int total = entries.Count;
        long totalBytesExtracted = 0;
        int count = 0;

        foreach (var entry in entries)
        {
            count++;
            var entryPath = Path.Combine(targetDir, entry.FullName.Replace('/', '\\'));
            var dir = Path.GetDirectoryName(entryPath);
            if (dir != null) Directory.CreateDirectory(dir);

            if (entry.Length > 0)
            {
                using var entryStream = entry.Open();
                using var fileStream = File.Create(entryPath);
                entryStream.CopyTo(fileStream);
                totalBytesExtracted += entry.Length;
            }

            onProgress(entry.FullName, count, total, totalBytesExtracted, payloadLen);
        }

        Log($"Extracted {count} files ({totalBytesExtracted / 1024 / 1024} MB)");
    }

    // ════════════════════════════════════════════════════════════
    //  SHORTCUTS
    // ════════════════════════════════════════════════════════════

    private static void CreateStartMenuShortcut(string installDir)
    {
        var dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu),
            "Programs", $"{AppName} by {Developer}");
        Directory.CreateDirectory(dir);
        CreateLnkShortcut(Path.Combine(dir, $"{AppName}.lnk"),
            Path.Combine(installDir, AppExe),
            $"Launch {AppName} by {Developer}");
    }

    private static void CreateDesktopShortcut(string installDir)
    {
        var desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
        CreateLnkShortcut(Path.Combine(desktop, $"{AppName} by {Developer}.lnk"),
            Path.Combine(installDir, AppExe),
            $"{AppName} — by {Developer}");
    }

    private static void CreateLnkShortcut(string shortcutPath, string targetPath, string description)
    {
        try
        {
            var shell = Activator.CreateInstance(Type.GetTypeFromProgID("WScript.Shell")!);
            if (shell == null) return;
            dynamic ws = shell;
            var shortcut = ws.CreateShortcut(shortcutPath);
            shortcut.TargetPath = targetPath;
            shortcut.WorkingDirectory = Path.GetDirectoryName(targetPath);
            shortcut.Description = description;
            shortcut.IconLocation = $"{targetPath},0";
            shortcut.Save();
            System.Runtime.InteropServices.Marshal.ReleaseComObject(ws);
            Log($"Created .lnk shortcut: {shortcutPath}");
        }
        catch (Exception ex)
        {
            Log($"Failed to create .lnk: {ex.Message}, falling back to .url");
            WriteUrlShortcut(shortcutPath.Replace(".lnk", ".url"), targetPath);
        }
    }

    private static void WriteUrlShortcut(string path, string targetExe)
    {
        var sb = new StringBuilder();
        sb.AppendLine("[InternetShortcut]");
        sb.AppendLine($"URL=file:///{targetExe.Replace("\\", "/")}");
        sb.AppendLine($"IconFile={targetExe}");
        sb.AppendLine("IconIndex=0");
        File.WriteAllText(path, sb.ToString(), Encoding.UTF8);
    }

    private static bool BytesEqual(byte[] a, byte[] b)
    {
        if (a.Length != b.Length) return false;
        for (int i = 0; i < a.Length; i++)
            if (a[i] != b[i]) return false;
        return true;
    }
}
