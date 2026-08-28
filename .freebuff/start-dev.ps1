# Start vite in a new window, detached
$p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'C:\myHMS\node_modules\.bin\vite.cmd --port 5173' -WorkingDirectory 'C:\myHMS\apps\web' -WindowStyle Hidden -PassThru
$p.Id | Out-File 'C:\myHMS\.freebuff\preview-pid.txt' -NoNewline
