<#
.SYNOPSIS
  GIHM-HIS bundled facility edge for Windows (docs/26 §6 6d).

.DESCRIPTION
  Packages and manages the facility-edge API (Node + SQLite — no Docker) so a
  workstation running the desktop shell can BE the facility server when the
  LAN has no dedicated server yet. The shell (Tauri) talks to the same
  local-backend dir this script manages: it reads backend.json, spawns the API
  via tsx, and tracks backend.pid.

  The directory layout matches the Tauri shell: the shell resolves its
  local-data dir as %LOCALAPPDATA%\{identifier} (identifier
  "gh.gihm.his.desktop" in tauri.conf.json) and looks for local-backend there.

  Two deployment modes (see README.md):
    A. LAN server   -> deploy/edge/ (Docker) — the classic facility edge.
    B. Workstation  -> this script (native Node) — the bundled backend for
                       the desktop client. Use `provision` once, then let the
                       shell auto-start it, or `start`/`stop` manually.

.PARAMETER Action
  build       Install/refresh the workspace dependencies the bundle needs
              (npm ci --workspace apps/api + prisma generate). Run on the
              build machine before copying the repo as a bundle.
  provision   Copy the repo as a runtime bundle into %LOCALAPPDATA%\
              gh.gihm.his.desktop\local-backend (robocopy, skips
              source-control/op artifacts), generate a fresh JWT secret,
              create the SQLite schema (prisma db push) and optionally seed
              demo data.
  start       Start the API process (detached). No-op if already running.
  stop        Stop the API process.
  status      Print the current state (also what the shell reports).

.PARAMETER Seed
  With provision: also load the synthetic demo dataset (prisma seed).
  Defaults to $false — a production facility starts empty.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File backend.ps1 build
  powershell -ExecutionPolicy Bypass -File backend.ps1 provision -Seed
  powershell -ExecutionPolicy Bypass -File backend.ps1 status
#>
param(
  [ValidateSet("build", "provision", "start", "stop", "status")]
  [string]$Action = "status",
  [switch]$Seed
)

$ErrorActionPreference = "Stop"

# Repo root = deploy/edge/windows -> up 3.
$Repo = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
# Must match the Tauri bundle identifier (tauri.conf.json) — the shell reads
# its local-data dir as %LOCALAPPDATA%\{identifier}.
$Base = Join-Path $env:LOCALAPPDATA "gh.gihm.his.desktop"
$Target = Join-Path $Base "local-backend"
$DataDir = Join-Path $Target "data"
$PidFile = Join-Path $Target "backend.pid"
$Port = 4000

function Write-Step([string]$msg) { Write-Host "[backend] $msg" -ForegroundColor Cyan }
function Write-Err([string]$msg) { Write-Host "[backend] $msg" -ForegroundColor Red }

# ---------------------------------------------------------------- build ----
# Refresh the API workspace deps (root node_modules incl. tsx + prisma client).
if ($Action -eq "build") {
  Write-Step "Installing API workspace dependencies from $Repo ..."
  Push-Location $Repo
  try {
    npm ci --workspace apps/api --include-workspace-root
    Push-Location apps/api
    npx prisma generate
    Pop-Location
  }
  finally { Pop-Location }
  Write-Step "Dependencies ready. Copy the repo (or run 'provision') to package the backend bundle."
  exit 0
}

# ----------------------------------------------------------- provision ----
if ($Action -eq "provision") {
  if (Test-Path (Join-Path $Target "backend.json")) {
    Write-Err "Already provisioned at $Target (backend.json present). Re-run with 'stop' + remove the dir to re-provision."
    exit 1
  }
  if (-not (Test-Path (Join-Path $Repo "apps\api"))) {
    Write-Err "apps/api not found under $Repo — run this script from the repo checkout (or copy the repo first)."
    exit 1
  }
  Write-Step "Provisioning the bundled backend into $Target ..."
  New-Item -ItemType Directory -Force -Path $Target, $DataDir | Out-Null

  # Copy the runtime (root deps + apps/api). Exclude source/ops artifacts the
  # API never needs — the shell embeds the SPA, so no web build is required.
  # robocopy exit codes: 0–7 success, >= 8 failure — check after EACH copy.
  robocopy $Repo $Target /E /XD .git node_modules apps\web docs deploy e2e desktop \
    /XF *.log *.db *.db-journal .env > $null
  if ($LASTEXITCODE -ge 8) { Write-Err "robocopy (repo) failed (exit $LASTEXITCODE)"; exit 1 }
  robocopy (Join-Path $Repo "node_modules") (Join-Path $Target "node_modules") /E /XD .cache > $null
  if ($LASTEXITCODE -ge 8) { Write-Err "robocopy (node_modules) failed (exit $LASTEXITCODE)"; exit 1 }
  $LASTEXITCODE = 0

  # Fresh signing secret (per-char sampling — Get-Random -Count cannot exceed
  # the collection size) + database URL (Windows file: URL, forward slashes).
  $charCodes = (48..57) + (65..90) + (97..122)
  $jwt = -join (1..64 | ForEach-Object { [char]($charCodes | Get-Random) })
  $dbUrl = "file:$($DataDir -replace '\\', '/')/edge.db"
  $cfg = @{
    node = "node"
    port = $Port
    env  = @{
      JWT_SECRET           = $jwt
      DATABASE_URL         = $dbUrl
      REMINDER_JOB_ENABLED = "true"
      # Deliberately NO WEB_ORIGIN: the API's boot default already allow-lists
      # the Tauri webview origins (tauri://localhost, http://tauri.localhost)
      # plus the browser PWA — overriding it here would block the shell.
    }
  }
  $cfg | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $Target "backend.json") -Encoding UTF8
  Write-Step "backend.json written (port $Port, db $dbUrl)."

  # Create the schema (prisma db push) — the API does not bootstrap its own DB.
  Push-Location (Join-Path $Target "apps\api")
  try {
    $env:DATABASE_URL = $dbUrl
    npx prisma generate
    npx prisma db push --skip-generate
    if ($Seed) {
      Write-Step "Seeding the synthetic demo dataset ..."
      npm run db:seed
    }
  }
  finally {
    Pop-Location
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  }

  Write-Step "Provisioned. Start the backend with 'backend.ps1 start' — the desktop shell also auto-starts it on launch."
  exit 0
}

# ------------------------------------------------------------ helpers -----
function Get-BackendPid {
  if (Test-Path $PidFile) {
    $raw = (Get-Content $PidFile -Raw).Trim()
    if ($raw -match '^\d+$') { return [int]$raw }
  }
  return $null
}

function Test-PidAlive([int]$procId) {
  return $null -ne (Get-Process -Id $procId -ErrorAction SilentlyContinue)
}

function Show-Status {
  $provisioned = Test-Path (Join-Path $Target "backend.json")
  $procId = Get-BackendPid
  $running = $provisioned -and $null -ne $procId -and (Test-PidAlive $procId)
  $state = if (-not $provisioned) { "NOT_PROVISIONED" }
           elseif ($running) { "RUNNING" }
           else { "STOPPED" }
  Write-Host "provisioned=$provisioned running=$running pid=$procId port=$Port dir=$Target state=$state"
  if (-not $provisioned) { Write-Host "Hint: run 'backend.ps1 provision' to install the bundled edge." }
}

# -------------------------------------------------------------- start -----
if ($Action -eq "start") {
  if (-not (Test-Path (Join-Path $Target "backend.json"))) {
    Write-Err "Not provisioned — run 'backend.ps1 provision' first."
    exit 1
  }
  $procId = Get-BackendPid
  if ($null -ne $procId -and (Test-PidAlive $procId)) {
    Write-Step "Already running (pid $procId)."
    Show-Status
    exit 0
  }
  # The API runs via tsx (no compiled server.js) — locate the CLI in the bundle.
  $tsx = Join-Path $Target "node_modules\tsx\dist\cli.mjs"
  if (-not (Test-Path $tsx)) { $tsx = Join-Path $Target "apps\api\node_modules\tsx\dist\cli.mjs" }
  if (-not (Test-Path $tsx)) { Write-Err "tsx not found in the bundle — re-run 'build' + 'provision'."; exit 1 }

  # The API reads its runtime config from backend.json (JWT_SECRET,
  # DATABASE_URL, …). Start-Process spawns a child of THIS process, so apply
  # them here first — Windows PowerShell 5.1 has no Start-Process -Environment,
  # and without DATABASE_URL the API crashes at boot (Prisma requires it).
  $cfg = Get-Content (Join-Path $Target "backend.json") -Raw | ConvertFrom-Json
  if ($cfg.env) {
    foreach ($prop in $cfg.env.PSObject.Properties) {
      [Environment]::SetEnvironmentVariable($prop.Name, [string]$prop.Value, "Process")
    }
  }

  # Separate stdout/stderr files — Start-Process cannot redirect both to the
  # same path (the second open fails while the first handle is in use).
  $log = Join-Path $Base "local-backend.log"
  $errLog = "$log.err"
  Write-Step "Starting the bundled API (logs: $log, $errLog) ..."
  $proc = Start-Process -FilePath "node" -ArgumentList "`"$tsx`"", "apps\api\src\server.ts" `
    -WorkingDirectory $Target `
    -RedirectStandardOutput $log -RedirectStandardError $errLog -WindowStyle Hidden -PassThru
  $proc.Id | Set-Content $PidFile
  Write-Step "Started (pid $($proc.Id)) — API on http://localhost:$Port, docs /docs."
  Show-Status
  exit 0
}

# --------------------------------------------------------------- stop -----
if ($Action -eq "stop") {
  $procId = Get-BackendPid
  if ($null -ne $procId) {
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($null -ne $proc) { Stop-Process -Id $procId -Force }
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    Write-Step "Stopped (pid $procId)."
  }
  else {
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    Write-Step "Not running."
  }
  exit 0
}

# ------------------------------------------------------------- status -----
Show-Status
