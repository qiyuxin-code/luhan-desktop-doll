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

python3 - "$ICON_PNG" <<'PY'
from collections import deque
from pathlib import Path
from PIL import Image
import sys

path = Path(sys.argv[1])
img = Image.open(path).convert("RGBA")
px = img.load()
width, height = img.size
queue = deque()
seen = set()

def is_background(x, y):
    r, g, b, a = px[x, y]
    return a > 0 and r >= 245 and g >= 245 and b >= 245

for x in range(width):
    queue.append((x, 0))
    queue.append((x, height - 1))
for y in range(height):
    queue.append((0, y))
    queue.append((width - 1, y))

while queue:
    x, y = queue.popleft()
    if (x, y) in seen or x < 0 or y < 0 or x >= width or y >= height:
        continue
    seen.add((x, y))
    if not is_background(x, y):
        continue
    r, g, b, a = px[x, y]
    px[x, y] = (r, g, b, 0)
    queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

img.save(path, "PNG")
PY

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
