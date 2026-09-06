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

            // Non-blocking update check against the published manifest
            // (points at GitHub Releases; see build-release.mjs).
            try
            {
                _ = AutoUpdater.CheckForUpdateAsync(
                    "https://dist-chi-one-cef2ntnu3d.vercel.app/desktop/latest.json");
            }
            catch { /* update checks must never block startup */ }
        }
    }
}
