import os
from PIL import Image

def transparentize_image(file_path, white_threshold=245):
    print(f"Processing {file_path}...")
    img = Image.open(file_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if r >= white_threshold and g >= white_threshold and b >= white_threshold:
                pixels[x, y] = (r, g, b, 0)

    img.save(file_path, format="PNG")
    print(f"Saved transparent version of {file_path}")

def main():
    # Process haha-list.png
    haha_path = "assets/haha/haha-list.png"
    if os.path.exists(haha_path):
        transparentize_image(haha_path)

    # Process xuanzhuan-list.png
    xz_path = "assets/xuanzhuan/xuanzhuan-list.png"
    if os.path.exists(xz_path):
        transparentize_image(xz_path)

    # Process bubble-list files
    bubble_dir = "assets/bubble-list"
    if os.path.exists(bubble_dir):
        for f in os.listdir(bubble_dir):
            if f.endswith(".png"):
                transparentize_image(os.path.join(bubble_dir, f))

    # Process flower-list files
    flower_dir = "assets/flower-list"
    if os.path.exists(flower_dir):
        for f in os.listdir(flower_dir):
            if f.endswith(".png"):
                transparentize_image(os.path.join(flower_dir, f))

if __name__ == "__main__":
    main()
