# Nebula one-line installer (Windows)
#
#   irm https://raw.githubusercontent.com/orange0730/nebula/main/scripts/install.ps1 | iex
#
# Downloads the latest pre-built Nebula release plus Vencord's official
# installer binary, then runs the installer in "dev install" mode pointed at
# the downloaded build so it patches your local Discord install.
#
# NOTE: this script has not been tested on a real Windows machine yet. If it
# breaks for you, please open an issue: https://github.com/orange0730/nebula/issues

$ErrorActionPreference = "Stop"

$repo = "orange0730/nebula"

# The Vencord installer's "dev install" mode patches Discord to load
# patcher.js from this exact path at every Discord startup - it does NOT
# copy the files into Discord's own directory. So this has to be somewhere
# permanent, not a temp directory that gets deleted after this script exits
# (Discord would fail to start with "Cannot find module ...\dist\patcher.js").
$installDir = Join-Path $env:LOCALAPPDATA "nebula"
$distDir = Join-Path $installDir "dist"

# Only the installer binary download is temporary; safe to clean up.
$tmp = Join-Path $env:TEMP ("nebula-install-" + [System.Guid]::NewGuid().ToString("N").Substring(0, 8))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null

try {
    Write-Host "==> Downloading latest Nebula build to $installDir ..."
    $distZip = Join-Path $tmp "nebula-dist.zip"
    Invoke-WebRequest -Uri "https://github.com/$repo/releases/download/latest/nebula-dist.zip" -OutFile $distZip

    if (Test-Path $distDir) {
        Remove-Item -Path $distDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $distDir -Force | Out-Null
    Expand-Archive -Path $distZip -DestinationPath $distDir -Force

    Write-Host "==> Downloading Vencord installer..."
    $installerExe = Join-Path $tmp "VencordInstallerCli.exe"
    Invoke-WebRequest -Uri "https://github.com/Vencord/Installer/releases/latest/download/VencordInstallerCli.exe" -OutFile $installerExe

    Write-Host "==> Launching installer - pick your Discord install to patch Nebula into it."

    $env:VENCORD_USER_DATA_DIR = $installDir
    $env:VENCORD_DEV_INSTALL = "1"
    & $installerExe

    Write-Host ""
    Write-Host "==> Done! Restart Discord for the patch to take effect, then enable"
    Write-Host "    LiveTheme and NebulaFreeMode under Settings -> Vencord -> Plugins."
    Write-Host ""
    Write-Host "    Re-running this script later will update Nebula to the latest build."
}
finally {
    Remove-Item -Path $tmp -Recurse -Force -ErrorAction SilentlyContinue
}
