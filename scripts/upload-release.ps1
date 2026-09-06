param([string]$Token, [long]$ReleaseId)
$base = "https://uploads.github.com/repos/shacomputecgh/gihm-his/releases/$ReleaseId/assets"
$files = @(
  @{ name = "GIHM-HIS-0.2.1-Setup.exe";    path = "D:\myHMS\public\desktop\GIHM-HIS-0.2.1-Setup.exe" },
  @{ name = "GIHM-HIS-0.2.1-Portable.zip"; path = "D:\myHMS\public\desktop\GIHM-HIS-0.2.1-Portable.zip" }
)
foreach ($f in $files) {
  Write-Output "[$(Get-Date -Format HH:mm:ss)] uploading $($f.name) ..."
  $url = "$($base)?name=$($f.name)"
  # --retry: GitHub upload sessions drop on long transfers; retry restarts cleanly
  curl.exe -s -S --retry 5 --retry-delay 10 --retry-all-errors -m 3600 -X POST -H "Authorization: token $Token" -H "Content-Type: application/octet-stream" --data-binary "@$($f.path)" -o "$($f.path).upload.json" $url
  Write-Output "[$(Get-Date -Format HH:mm:ss)] done $($f.name) (exit $LASTEXITCODE)"
}
Write-Output "UPLOAD_ALL_DONE"
