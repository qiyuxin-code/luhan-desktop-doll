#!/usr/bin/env python3
"""将 export/details 里 PNG 的白底转为透明（RGB → RGBA）。"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ALPHA_DIRS = [
    ROOT / "assets" / "export" / "body",
    ROOT / "assets" / "export" / "details",
    ROOT / "assets" / "layers" / "body",
    ROOT / "assets" / "layers" / "details",
]
WHITE = 245


def fix_file(path: Path) -> bool:
    im = Image.open(path).convert("RGBA")
    px = im.load()
    changed = False
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if r >= WHITE and g >= WHITE and b >= WHITE and a > 0:
                px[x, y] = (r, g, b, 0)
                changed = True
    if changed:
        im.save(path, format="PNG")
        print(f"[fix-alpha] {path.relative_to(ROOT)}")
    return changed


def main() -> None:
    n = 0
    for d in ALPHA_DIRS:
        if not d.is_dir():
            continue
        for png in sorted(d.glob("*.png")):
            if fix_file(png):
                n += 1
    if n == 0:
        print("[fix-alpha] 无需处理或目录为空")


if __name__ == "__main__":
    main()
