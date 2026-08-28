@echo off
cd /d C:\myHMS\desktop
set PATH=C:\Users\%USERNAME%\.cargo\bin;%PATH%
echo Starting Tauri build at %date% %time% > C:\myHMS\.freebuff\tauri-build.log
npx tauri build --bundles msi >> C:\myHMS\.freebuff\tauri-build.log 2>&1
echo Build finished at %date% %time% >> C:\myHMS\.freebuff\tauri-build.log
