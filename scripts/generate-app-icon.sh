#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/assets/action-sing.svg"
OUT="$ROOT/build"
ICON_PNG="$OUT/icon.png"
ICONSET="$OUT/icon.iconset"
ICON_ICNS="$OUT/icon.icns"

mkdir -p "$OUT"

if [[ "$(uname)" == "Darwin" ]]; then
  qlmanage -t -s 1024 -o "$OUT" "$SRC" >/dev/null 2>&1
  mv -f "$OUT/action-sing.svg.png" "$ICON_PNG"
else
  echo "generate-app-icon: macOS qlmanage unavailable; using existing $ICON_PNG" >&2
  if [[ ! -f "$ICON_PNG" ]]; then
    echo "Missing $ICON_PNG. Run this script on macOS once, or add build/icon.png manually." >&2
    exit 1
  fi
fi

rm -rf "$ICONSET"
mkdir -p "$ICONSET"

sips -z 16 16 "$ICON_PNG" --out "$ICONSET/icon_16x16.png" >/dev/null
sips -z 32 32 "$ICON_PNG" --out "$ICONSET/icon_16x16@2x.png" >/dev/null
sips -z 32 32 "$ICON_PNG" --out "$ICONSET/icon_32x32.png" >/dev/null
sips -z 64 64 "$ICON_PNG" --out "$ICONSET/icon_32x32@2x.png" >/dev/null
sips -z 128 128 "$ICON_PNG" --out "$ICONSET/icon_128x128.png" >/dev/null
sips -z 256 256 "$ICON_PNG" --out "$ICONSET/icon_128x128@2x.png" >/dev/null
sips -z 256 256 "$ICON_PNG" --out "$ICONSET/icon_256x256.png" >/dev/null
sips -z 512 512 "$ICON_PNG" --out "$ICONSET/icon_256x256@2x.png" >/dev/null
sips -z 512 512 "$ICON_PNG" --out "$ICONSET/icon_512x512.png" >/dev/null
cp "$ICON_PNG" "$ICONSET/icon_512x512@2x.png"

iconutil -c icns "$ICONSET" -o "$ICON_ICNS"
rm -rf "$ICONSET"

echo "Generated $ICON_PNG and $ICON_ICNS from action-sing.svg"
