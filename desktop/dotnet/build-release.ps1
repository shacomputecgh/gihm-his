#Requires -Version 5.1
# ============================================================================
#  GES-School-MIS Desktop — Release Build (PowerShell)
#  Delegates to the cross-platform Node.js build script.
# ============================================================================
param(
    [string]$Configuration = "Release",
    [string]$Version = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot

$buildArgs = @("$ScriptDir\build-release.mjs", "--config", $Configuration)
if ($Version) { $buildArgs += "--version"; $buildArgs += $Version }

node @buildArgs

if ($LASTEXITCODE -ne 0) {
    throw "Build failed with exit code $LASTEXITCODE"
}
