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

    private static string? GetSelfPath()
    {
        return Environment.ProcessPath
            ?? Process.GetCurrentProcess().MainModule?.FileName
            ?? System.Reflection.Assembly.GetExecutingAssembly().Location;
    }

    private static void Log(string msg)
    {
        try { File.AppendAllText(LogPath, $"[{DateTime.Now:HH:mm:ss}] {msg}\n"); } catch { }
    }

    [STAThread]
    static void Main()
    {
        var args = Environment.GetCommandLineArgs();

        // ── UNINSTALL MODE ─────────────────────────────────────
        // args[0] = exe path, args[1] = "--uninstall"
        if (args.Length > 1 && args[1] == "--uninstall")
        {
            RunUninstaller();
            return;
        }

        // ── INSTALL MODE ───────────────────────────────────────
        try { File.Delete(LogPath); } catch { }
        Log("Installer starting");

        var app = new Application { ShutdownMode = ShutdownMode.OnExplicitShutdown };

        // ── Standard Windows Installer UI ──
        // Blue header bar
        var headerBar = new DockPanel
        {
            Height = 60,
            Background = new LinearGradientBrush(
                Color.FromRgb(0x00, 0x52, 0x9A),
                Color.FromRgb(0x00, 0x3D, 0x7A),
                0),
            Margin = new Thickness(0, 0, 0, 0),
        };
        var headerText = new StackPanel
        {
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(20, 0, 0, 0),
        };
        try
        {
            var logoPath = Path.Combine(AppContext.BaseDirectory, "assets", "app-icon.png");
            if (File.Exists(logoPath))
            {
                var bitmap = new System.Windows.Media.Imaging.BitmapImage(new Uri(logoPath));
                var img = new Image { Source = bitmap, Width = 36, Height = 36, Margin = new Thickness(0, 0, 12, 0) };
                headerBar.Children.Add(img);
                DockPanel.SetDock(img, Dock.Left);
            }
        }
        catch { }
        headerText.Children.Add(new TextBlock
        {
            Text = $"{AppName} Setup",
            Foreground = Brushes.White, FontSize = 18, FontWeight = FontWeights.SemiBold,
        });
        headerText.Children.Add(new TextBlock
        {
            Text = $"Version {Version} — by {Developer}",
            Foreground = new SolidColorBrush(Color.FromRgb(0xCC, 0xDD, 0xEE)),
            FontSize = 11,
        });
        headerBar.Children.Add(headerText);

        // White content area
        var contentPanel = new StackPanel { Margin = new Thickness(30, 20, 30, 20) };

        var titleText = new TextBlock
        {
            Text = "Installing…",
            Foreground = new SolidColorBrush(Color.FromRgb(0x1A, 0x1A, 0x2E)),
            FontSize = 16, FontWeight = FontWeights.SemiBold,
            Margin = new Thickness(0, 0, 0, 6),
        };
        contentPanel.Children.Add(titleText);

        var statusText = new TextBlock
        {
            Text = "Please wait while the setup installs GIHM-HIS on your computer.",
            Foreground = new SolidColorBrush(Color.FromRgb(0x55, 0x55, 0x55)),
            FontSize = 12,
            Margin = new Thickness(0, 0, 0, 16),
        };
        contentPanel.Children.Add(statusText);

        // Install location
        var pathLabel = new TextBlock
        {
            Text = "Install to: C:\\GIHM-HIS",
            Foreground = new SolidColorBrush(Color.FromRgb(0x66, 0x66, 0x66)),
            FontSize = 11, Margin = new Thickness(0, 0, 0, 12),
        };
        contentPanel.Children.Add(pathLabel);

        // Green progress bar
        var progressBar = new ProgressBar
        {
            Height = 22, Minimum = 0, Maximum = 100, Value = 0,
            Foreground = new SolidColorBrush(Color.FromRgb(0x0B, 0x8A, 0x0B)),
            Background = new SolidColorBrush(Color.FromRgb(0xE0, 0xE0, 0xE0)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(0xCC, 0xCC, 0xCC)),
            BorderThickness = new Thickness(1),
            Margin = new Thickness(0, 0, 0, 4),
        };
        contentPanel.Children.Add(progressBar);

        // Status row: file info + percentage
        var fileLabel = new TextBlock
        {
            Text = "", Foreground = new SolidColorBrush(Color.FromRgb(0x88, 0x88, 0x88)),
            FontSize = 10, TextWrapping = TextWrapping.Wrap,
            Margin = new Thickness(0, 0, 0, 4),
        };
        contentPanel.Children.Add(fileLabel);

        var progressLabel = new TextBlock
        {
            Text = "0% complete",
            Foreground = new SolidColorBrush(Color.FromRgb(0x0B, 0x8A, 0x0B)),
            FontSize = 11, FontWeight = FontWeights.SemiBold,
            HorizontalAlignment = HorizontalAlignment.Right,
        };
        contentPanel.Children.Add(progressLabel);

        // Separator
        var sep = new Border
        {
            Height = 1, Background = new SolidColorBrush(Color.FromRgb(0xDD, 0xDD, 0xDD)),
            Margin = new Thickness(0, 10, 0, 0),
        };
        contentPanel.Children.Add(sep);

        // Footer
        var footer = new TextBlock
        {
            Text = $"© {DateTime.Now.Year} {Developer} — Hard Works Never Fail",
            Foreground = new SolidColorBrush(Color.FromRgb(0xAA, 0xAA, 0xAA)),
            FontSize = 10, Margin = new Thickness(0, 8, 0, 0),
            HorizontalAlignment = HorizontalAlignment.Center,
        };
        contentPanel.Children.Add(footer);

        // Main layout
        var mainPanel = new DockPanel();
        DockPanel.SetDock(headerBar, Dock.Top);
        mainPanel.Children.Add(headerBar);
        mainPanel.Children.Add(contentPanel);

        var window = new Window
        {
            Title = $"{AppName} Setup",
            Width = 520, Height = 320,
            WindowStartupLocation = WindowStartupLocation.CenterScreen,
            WindowStyle = WindowStyle.SingleBorderWindow, ResizeMode = ResizeMode.NoResize,
            Background = Brushes.White,
            Content = mainPanel,
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

                // Kill any running instance before overwriting
                KillRunningInstance(installDir);

                // Extract ZIP payload with per-file progress
                titleText.Text = "Extracting files…";
                statusText.Text = "Please wait while the setup extracts application files.";
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
                        progressLabel.Text = $"{(int)(10 + pct)}% complete";
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
                progressLabel.Text = "90% complete";
                Log($"Extraction complete: {fileCount} files");
                fileLabel.Text = $"Extracted {fileCount} files";

                // Create standalone uninstaller EXE
                titleText.Text = "Finalizing…";
                statusText.Text = "Setting up uninstaller and registering in Control Panel.";
                fileLabel.Text = "";
                await Task.Delay(100);
                CreateUninstallExecutable(installDir);
                Log("Uninstall.exe created");

                // Register in Windows Control Panel
                RegisterInControlPanel(installDir);
                Log("Registered in Control Panel");

                // Create shortcuts with developer name
                statusText.Text = "Creating Start Menu and Desktop shortcuts.";
                await Task.Delay(200);
                CreateStartMenuShortcut(installDir);
                CreateDesktopShortcut(installDir);
                Log("Shortcuts created");
                progressBar.Value = 95;
                progressLabel.Text = "95% complete";

                // Launch
                titleText.Text = "Launching…";
                statusText.Text = $"{AppName} is starting. You may close this window.";
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
                progressLabel.Text = "100% complete";
                titleText.Text = "Installation Complete!";
                statusText.Text = $"{AppName} has been successfully installed.";
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
        Log("=== UNINSTALLER STARTING ===");

        // When called from Control Panel (--uninstall), skip confirmation dialog
        var args = Environment.GetCommandLineArgs();
        bool fromControlPanel = args.Length > 1 && args[1] == "--uninstall";

        if (!fromControlPanel)
        {
            var result = MessageBox.Show(
                $"Are you sure you want to uninstall {AppName}?\n\n" +
                $"This will remove the application and all its data from your computer.\n\n" +
                $"Click OK to uninstall, or Cancel to keep it installed.",
                $"Uninstall {AppName}",
                MessageBoxButton.OKCancel, MessageBoxImage.Question);

            if (result != MessageBoxResult.OK)
            {
                Log("Uninstall cancelled by user");
                return;
            }
        }

        var app = new Application { ShutdownMode = ShutdownMode.OnExplicitShutdown };

        // ── Standard Windows Uninstall UI ──
        var headerBar = new DockPanel
        {
            Height = 60,
            Background = new LinearGradientBrush(
                Color.FromRgb(0xA0, 0x20, 0x20),
                Color.FromRgb(0x80, 0x15, 0x15),
                0),
        };
        var headerText2 = new StackPanel
        {
            VerticalAlignment = VerticalAlignment.Center,
            Margin = new Thickness(20, 0, 0, 0),
        };
        headerText2.Children.Add(new TextBlock
        {
            Text = $"Uninstall {AppName}",
            Foreground = Brushes.White, FontSize = 18, FontWeight = FontWeights.SemiBold,
        });
        headerText2.Children.Add(new TextBlock
        {
            Text = "Remove application from your computer",
            Foreground = new SolidColorBrush(Color.FromRgb(0xFF, 0xCC, 0xCC)),
            FontSize = 11,
        });
        headerBar.Children.Add(headerText2);

        var content2 = new StackPanel { Margin = new Thickness(30, 20, 30, 20) };

        var titleText2 = new TextBlock
        {
            Text = "Removing…",
            Foreground = new SolidColorBrush(Color.FromRgb(0x1A, 0x1A, 0x2E)),
            FontSize = 16, FontWeight = FontWeights.SemiBold,
            Margin = new Thickness(0, 0, 0, 6),
        };
        content2.Children.Add(titleText2);

        var statusText = new TextBlock
        {
            Text = "Please wait while GIHM-HIS is being removed from your computer.",
            Foreground = new SolidColorBrush(Color.FromRgb(0x55, 0x55, 0x55)),
            FontSize = 12,
            Margin = new Thickness(0, 0, 0, 16),
        };
        content2.Children.Add(statusText);

        var progressBar2 = new ProgressBar
        {
            Height = 22, Minimum = 0, Maximum = 100, Value = 0,
            Foreground = new SolidColorBrush(Color.FromRgb(0xC0, 0x30, 0x30)),
            Background = new SolidColorBrush(Color.FromRgb(0xE0, 0xE0, 0xE0)),
            BorderBrush = new SolidColorBrush(Color.FromRgb(0xCC, 0xCC, 0xCC)),
            BorderThickness = new Thickness(1),
            Margin = new Thickness(0, 0, 0, 4),
        };
        content2.Children.Add(progressBar2);

        var progressLabel2 = new TextBlock
        {
            Text = "0% complete",
            Foreground = new SolidColorBrush(Color.FromRgb(0xC0, 0x30, 0x30)),
            FontSize = 11, FontWeight = FontWeights.SemiBold,
            HorizontalAlignment = HorizontalAlignment.Right,
        };
        content2.Children.Add(progressLabel2);

        var sep2 = new Border
        {
            Height = 1, Background = new SolidColorBrush(Color.FromRgb(0xDD, 0xDD, 0xDD)),
            Margin = new Thickness(0, 10, 0, 0),
        };
        content2.Children.Add(sep2);

        var footer2 = new TextBlock
        {
            Text = $"© {DateTime.Now.Year} {Developer} — Hard Works Never Fail",
            Foreground = new SolidColorBrush(Color.FromRgb(0xAA, 0xAA, 0xAA)),
            FontSize = 10, Margin = new Thickness(0, 8, 0, 0),
            HorizontalAlignment = HorizontalAlignment.Center,
        };
        content2.Children.Add(footer2);

        var mainPanel2 = new DockPanel();
        DockPanel.SetDock(headerBar, Dock.Top);
        mainPanel2.Children.Add(headerBar);
        mainPanel2.Children.Add(content2);

        var window = new Window
        {
            Title = $"Uninstall {AppName}",
            Width = 480, Height = 300,
            WindowStartupLocation = WindowStartupLocation.CenterScreen,
            WindowStyle = WindowStyle.SingleBorderWindow, ResizeMode = ResizeMode.NoResize,
            Background = Brushes.White,
            Content = mainPanel2,
        };

        window.ContentRendered += async (_, _) =>
        {
            try
            {
                Log("Step 0: Killing running instances");
                titleText2.Text = "Stopping application…";
                statusText.Text = "Closing any running instances of GIHM-HIS.";
                KillRunningInstances();
                progressBar2.Value = 10; progressLabel2.Text = "10% complete";
                await Task.Delay(500);

                Log("Step 1: Removing shortcuts");
                titleText2.Text = "Removing shortcuts…";
                statusText.Text = "Removing Start Menu and Desktop shortcuts.";
                RemoveShortcuts();
                progressBar2.Value = 30; progressLabel2.Text = "30% complete";
                await Task.Delay(200);

                Log("Step 2: Removing registry entries");
                titleText2.Text = "Removing registry entries…";
                statusText.Text = "Unregistering from Control Panel.";
                RemoveControlPanelEntry();
                progressBar2.Value = 50; progressLabel2.Text = "50% complete";
                await Task.Delay(200);

                Log("Step 3: Removing application data");
                titleText2.Text = "Removing application data…";
                statusText.Text = "Cleaning cached data and settings.";
                var appData = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), AppName);
                if (Directory.Exists(appData))
                {
                    try { Directory.Delete(appData, true); } catch (Exception ex)
                    {
                        Log($"AppData removal error: {ex.Message}");
                    }
                }
                progressBar2.Value = 60; progressLabel2.Text = "60% complete";
                await Task.Delay(200);

                Log("Step 4: Removing application files");
                titleText2.Text = "Removing application files…";
                statusText.Text = "Deleting program files from install directory.";
                progressBar2.Value = 70; progressLabel2.Text = "70% complete";

                // Find install dir from registry or fallback
                var installDir = PrimaryDir;
                try
                {
                    using var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(RegistryKey);
                    var loc = key?.GetValue("InstallLocation") as string;
                    if (!string.IsNullOrEmpty(loc) && Directory.Exists(loc))
                        installDir = loc;
                }
                catch { }

                if (Directory.Exists(installDir))
                {
                    foreach (var file in Directory.GetFiles(installDir))
                    {
                        var fn = Path.GetFileName(file);
                        // Skip the uninstaller itself — we delete it via batch later
                        if (fn == UninstallExe) continue;
                        try { File.Delete(file); } catch { }
                    }
                    foreach (var dir in Directory.GetDirectories(installDir))
                    {
                        try { Directory.Delete(dir, true); } catch { }
                    }
                }

                progressBar2.Value = 90; progressLabel2.Text = "90% complete";
                await Task.Delay(500);

                titleText2.Text = "Uninstall Complete!";
                statusText.Text = $"{AppName} has been removed from your computer.";
                progressBar2.Value = 100; progressLabel2.Text = "100% complete";
                Log("Uninstall complete — scheduling self-delete");
                await Task.Delay(1500);

                // Self-delete: write a batch file that waits, deletes the uninstaller, then deletes itself
                var selfPath = GetSelfPath();
                if (selfPath != null && File.Exists(selfPath))
                {
                    var batchPath = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                        "GIHM-HIS-uninstall-selfdelete.bat");

                    var batchContent = new StringBuilder();
                    batchContent.AppendLine("@echo off");
                    batchContent.AppendLine("timeout /t 2 /nobreak >nul");
                    batchContent.AppendLine($"del /f /q \"{selfPath}\"");
                    batchContent.AppendLine($"if exist \"{selfPath}\" goto :retry");
                    batchContent.AppendLine($"rmdir /q \"{Path.GetDirectoryName(selfPath)}\" 2>nul");
                    batchContent.AppendLine("del /f /q \"%~f0\"");
                    batchContent.AppendLine("exit");
                    batchContent.AppendLine(":retry");
                    batchContent.AppendLine("timeout /t 3 /nobreak >nul");
                    batchContent.AppendLine($"del /f /q \"{selfPath}\"");
                    batchContent.AppendLine("del /f /q \"%~f0\"");

                    File.WriteAllText(batchPath, batchContent.ToString());

                    var psi = new ProcessStartInfo("cmd.exe",
                        $"/c \"{batchPath}\"")
                    {
                        WindowStyle = ProcessWindowStyle.Hidden,
                        CreateNoWindow = true
                    };
                    Process.Start(psi);
                }

                window.Close();
                app.Shutdown();
            }
            catch (Exception ex)
            {
                Log($"UNINSTALL ERROR: {ex}");
                titleText2.Text = "Error";
                statusText.Text = $"{ex.Message}";
                progressBar2.Value = 0; progressLabel2.Text = "";
                await Task.Delay(3000);
                window.Close();
                app.Shutdown();
            }
        };

        app.Run(window);
    }

    private static void KillRunningInstances()
    {
        try
        {
            var exeName = Path.GetFileNameWithoutExtension(AppExe);
            foreach (var proc in Process.GetProcessesByName(exeName))
            {
                try { proc.Kill(); proc.WaitForExit(3000); } catch { }
            }
            // Also try killing by uninstaller exe name
            var uninstallName = Path.GetFileNameWithoutExtension(UninstallExe);
            // Don't kill ourselves here — self-delete handles that
        }
        catch { }
    }

    private static void KillRunningInstance(string installDir)
    {
        try
        {
            var exeName = Path.GetFileNameWithoutExtension(AppExe);
            foreach (var proc in Process.GetProcessesByName(exeName))
            {
                try
                {
                    var procPath = proc.MainModule?.FileName;
                    if (procPath != null && procPath.StartsWith(installDir, StringComparison.OrdinalIgnoreCase))
                    {
                        Log($"Killing existing process: {proc.Id}");
                        proc.Kill();
                        proc.WaitForExit(5000);
                    }
                }
                catch { }
            }
        }
        catch { }
    }

    private static void CreateUninstallExecutable(string installDir)
    {
        var selfPath = GetSelfPath();
        if (selfPath == null) return;

        var uninstallPath = Path.Combine(installDir, UninstallExe);
        File.Copy(selfPath, uninstallPath, true);
        Log($"Copied installer to uninstaller: {uninstallPath}");
    }

    private static void RegisterInControlPanel(string installDir)
    {
        try
        {
            using var key = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(RegistryKey);
            if (key != null)
            {
                key.SetValue("DisplayName", $"{AppName} by {Developer}");
                key.SetValue("DisplayVersion", Version);
                key.SetValue("Publisher", Developer);
                key.SetValue("InstallLocation", installDir);
                // KEY FIX: UninstallString MUST include --uninstall flag
                key.SetValue("UninstallString",
                    $"\"{Path.Combine(installDir, UninstallExe)}\" --uninstall");
                key.SetValue("QuietUninstallString",
                    $"\"{Path.Combine(installDir, UninstallExe)}\" --uninstall");
                key.SetValue("InstallDate", DateTime.Now.ToString("yyyyMMdd"));
                key.SetValue("EstimatedSize", 140000);
                key.SetValue("NoModify", 1);
                key.SetValue("NoRepair", 1);
                key.SetValue("URLInfoAbout", "https://gihm.vercel.app");
                key.SetValue("URLUpdateInfo", "https://gihm.vercel.app");

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
            // Desktop shortcuts — remove from both DesktopDirectory and classic Desktop
            var desktopDirs = new[]
            {
                Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Desktop"),
            };
            foreach (var desktop in desktopDirs)
            {
                if (string.IsNullOrEmpty(desktop)) continue;
                var shortcut = Path.Combine(desktop, $"{AppName} by {Developer}.lnk");
                try { if (File.Exists(shortcut)) File.Delete(shortcut); } catch { }
            }

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
        var exePath = GetSelfPath()
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
        // Place shortcut in both DesktopDirectory and classic Desktop
        var dirs = new System.Collections.Generic.HashSet<string>();
        dirs.Add(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory));
        dirs.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Desktop"));
        foreach (var desktop in dirs)
        {
            if (string.IsNullOrEmpty(desktop)) continue;
            try
            {
                CreateLnkShortcut(Path.Combine(desktop, $"{AppName} by {Developer}.lnk"),
                    Path.Combine(installDir, AppExe),
                    $"{AppName} — by {Developer}");
            }
            catch { }
        }
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
