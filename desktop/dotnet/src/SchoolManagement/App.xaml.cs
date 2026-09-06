using System;
using System.Windows;
using SchoolManagement.Update;

namespace SchoolManagement
{
    public partial class App : Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            // Non-blocking update check against the published manifest.
            // Primary: the Vercel deployment; fallback: the manifest attached
            // to the GitHub Release itself (survives domain changes).
            try
            {
                _ = AutoUpdater.CheckForUpdateWithFallbackAsync(new[]
                {
                    "https://dist-chi-one-cef2ntnu3d.vercel.app/desktop/latest.json",
                    "https://github.com/shacomputecgh/gihm-his/releases/latest/download/latest.json",
                });
            }
            catch { /* update checks must never block startup */ }
        }
    }
}
