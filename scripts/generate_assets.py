from __future__ import annotations

import base64
import io
import re
from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"


def encode_base64(file_name: str) -> str:
    return base64.b64encode((PROJECT_ROOT / file_name).read_bytes()).decode("ascii")


def encode_asset_base64(file_name: str) -> str:
    return base64.b64encode((ASSETS_DIR / file_name).read_bytes()).decode("ascii")


def encode_transparent_asset_base64(file_name: str, white_threshold: int = 245) -> str:
    image = Image.open(ASSETS_DIR / file_name).convert("RGBA")
    pixels = image.load()

    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if r >= white_threshold and g >= white_threshold and b >= white_threshold:
                pixels[x, y] = (r, g, b, 0)

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("ascii")


def transparentize_svg_embedded_image(file_name: str, white_threshold: int = 245) -> bool:
    svg_path = ASSETS_DIR / file_name
    if not svg_path.exists():
        return False

    content = svg_path.read_text(encoding="utf-8")
    match = re.search(r"data:image/(png|jpeg);base64,([A-Za-z0-9+/=]+)", content)
    if not match:
        return False

    image = Image.open(io.BytesIO(base64.b64decode(match.group(2)))).convert("RGBA")
    pixels = image.load()

    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if r >= white_threshold and g >= white_threshold and b >= white_threshold:
                pixels[x, y] = (r, g, b, 0)

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    new_b64 = base64.b64encode(buffer.getvalue()).decode("ascii")
    updated = content[: match.start()] + "data:image/png;base64," + new_b64 + content[match.end() :]
    svg_path.write_text(updated, encoding="utf-8")
    return True


def write_svg(file_name: str, content: str) -> None:
    ASSETS_DIR.mkdir(exist_ok=True)
    (ASSETS_DIR / file_name).write_text(content, encoding="utf-8")


def build_cropped_svg(label: str, x: int, y: int, image_b64: str) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="{label}">
  <title>{label}</title>
  <image href="data:image/jpeg;base64,{image_b64}" x="-{x}" y="-{y}" width="1024" height="1024" preserveAspectRatio="xMidYMid slice" />
</svg>
"""


def build_full_svg(label: str, image_b64: str) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-label="{label}">
  <title>{label}</title>
  <image href="data:image/jpeg;base64,{image_b64}" width="1024" height="1024" preserveAspectRatio="xMidYMid meet" />
</svg>
"""


def build_window_svg(
    label: str,
    x: int,
    y: int,
    width: int,
    height: int,
    image_b64: str,
    image_mime: str = "image/jpeg",
    source_width: int = 1024,
    source_height: int = 1024,
) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{label}">
  <title>{label}</title>
  <image href="data:{image_mime};base64,{image_b64}" x="-{x}" y="-{y}" width="{source_width}" height="{source_height}" preserveAspectRatio="xMidYMid slice" />
</svg>
"""


def main() -> None:
    # Load base64 for standalone PNGs
    try:
        idle_sit_b64 = encode_transparent_asset_base64("idle-sit.png")
    except FileNotFoundError:
        idle_sit_b64 = None
        
    try:
        sit3_b64 = encode_transparent_asset_base64("sit3.png")
    except FileNotFoundError:
        sit3_b64 = None
        
    try:
        bubble_b64 = encode_transparent_asset_base64("bubble.png")
    except FileNotFoundError:
        bubble_b64 = None
        
    try:
        flower_b64 = encode_transparent_asset_base64("flower.png")
    except FileNotFoundError:
        flower_b64 = None
        
    try:
        jump_b64 = encode_transparent_asset_base64("jump.png")
    except FileNotFoundError:
        jump_b64 = None

    # Tight crops around the standalone sticker PNGs.
    if idle_sit_b64:
        write_svg(
            "idle-sit.svg",
            build_window_svg("idle", 0, 100, 1200, 1850, idle_sit_b64, "image/png", 2048, 2048),
        )
        
    if sit3_b64:
        write_svg(
            "sit3.svg",
            # the bbox is (456, 111, 1642, 1960), we give it some padding
            build_window_svg("sit3", 350, 50, 1400, 2000, sit3_b64, "image/png", 2048, 2048),
        )
    
    if bubble_b64:
        write_svg(
            "bubble.svg",
            build_window_svg("bubble", 200, 250, 1000, 1450, bubble_b64, "image/png", 1344, 2016),
        )
    
    if flower_b64:
        write_svg(
            "flower.svg",
            build_window_svg("flower", 200, 200, 930, 1500, flower_b64, "image/png", 1344, 2016),
        )
    
    if jump_b64:
        write_svg(
            "jump.svg",
            build_window_svg("jump", 85, 200, 1210, 1600, jump_b64, "image/png", 1344, 2016),
        )

    # If original PNGs are unavailable, still try to clean the current SVG assets in place.
    for svg_name in [
        "idle-sit.svg",
        "sit3.svg",
        "bubble.svg",
        "flower.svg",
        "jump.svg",
        "action-sing.svg",
        "action-pat.svg",
        "action-jump.svg",
    ]:
        transparentize_svg_embedded_image(svg_name)

if __name__ == "__main__":
    main()
