#!/usr/bin/env bash
# Nebula one-line installer (Linux / macOS)
#
#   curl -fsSL https://raw.githubusercontent.com/orange0730/nebula/main/scripts/install.sh | bash
#
# Downloads the latest pre-built Nebula release plus Vencord's official
# installer binary, then runs the installer in "dev install" mode pointed at
# the downloaded build so it patches your local Discord install.

set -euo pipefail

REPO="orange0730/nebula"

# The Vencord installer's "dev install" mode patches Discord to load
# patcher.js from this exact path at every Discord startup - it does NOT
# copy the files into Discord's own directory. So this has to be somewhere
# permanent, not a temp dir that gets deleted when this script exits
# (that was a real bug here: Discord failed to start with "Cannot find
# module .../nebula/dist/patcher.js" because it used to point at a
# mktemp -d directory that was already gone).
INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/nebula"
DIST_DIR="$INSTALL_DIR/dist"

# Only the installer binary download is temporary; safe to clean up.
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "==> Downloading latest Nebula build to $INSTALL_DIR ..."
curl -fsSL "https://github.com/$REPO/releases/download/latest/nebula-dist.zip" -o "$TMP_DIR/nebula-dist.zip"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"
unzip -q "$TMP_DIR/nebula-dist.zip" -d "$DIST_DIR"

OS="$(uname -s)"
case "$OS" in
    Linux*)
        INSTALLER_FILE="VencordInstallerCli-linux"
        ;;
    Darwin*)
        INSTALLER_FILE="VencordInstaller.MacOS.zip"
        ;;
    *)
        echo "Unsupported OS: $OS. On Windows, use scripts/install.ps1 instead." >&2
        exit 1
        ;;
esac

echo "==> Downloading Vencord installer ($INSTALLER_FILE)..."
curl -fsSL "https://github.com/Vencord/Installer/releases/latest/download/$INSTALLER_FILE" -o "$TMP_DIR/$INSTALLER_FILE"

if [ "$INSTALLER_FILE" = "VencordInstaller.MacOS.zip" ]; then
    unzip -q "$TMP_DIR/$INSTALLER_FILE" -d "$TMP_DIR"
    INSTALLER_BIN="$TMP_DIR/VencordInstaller.app/Contents/MacOS/VencordInstaller"
else
    INSTALLER_BIN="$TMP_DIR/$INSTALLER_FILE"
fi
chmod +x "$INSTALLER_BIN"

echo "==> Launching installer — pick your Discord install to patch Nebula into it."
echo "    (If your Discord was installed via snap, its directory is read-only;"
echo "     install Discord from discord.com's official tar.gz/deb instead.)"

# When this script is run via `curl ... | bash`, this process's own stdin is
# the pipe from curl, which is already exhausted by the time we get here.
# The installer is interactive and needs real keyboard input, so we connect
# it directly to the controlling terminal instead of inheriting our stdin.
if [ -r /dev/tty ]; then
    VENCORD_USER_DATA_DIR="$INSTALL_DIR" VENCORD_DEV_INSTALL=1 "$INSTALLER_BIN" < /dev/tty
else
    echo "No interactive terminal available (/dev/tty not readable)." >&2
    echo "Download the script and run it directly instead of piping into bash:" >&2
    echo "  curl -fsSL https://raw.githubusercontent.com/orange0730/nebula/main/scripts/install.sh -o install.sh" >&2
    echo "  bash install.sh" >&2
    exit 1
fi

echo ""
echo "==> Done! Restart Discord for the patch to take effect, then enable"
echo "    LiveTheme and NebulaFreeMode under Settings -> Vencord -> Plugins."
echo ""
echo "    Re-running this script later will update Nebula to the latest build."
