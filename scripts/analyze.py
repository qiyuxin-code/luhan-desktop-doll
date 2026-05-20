from PIL import Image

def analyze_columns(image_path):
    img = Image.open(image_path).convert("RGB")
    data = img.load()
    width, height = img.size
    
    col_diffs = []
    for x in range(width):
        diff = 0
        for y in range(height):
            r, g, b = data[x, y]
            # difference from white
            diff += (255 - r) + (255 - g) + (255 - b)
        col_diffs.append(diff)
        
    # Find first column with significant difference
    start_y = 0
    for y in range(height):
        diff = 0
        for x in range(width):
            r, g, b = data[x, y]
            diff += (255 - r) + (255 - g) + (255 - b)
        if diff > width * 3 * 2:
            start_y = y
            break
            
    end_y = height - 1
    for y in range(height - 1, -1, -1):
        diff = 0
        for x in range(width):
            r, g, b = data[x, y]
            diff += (255 - r) + (255 - g) + (255 - b)
        if diff > width * 3 * 2:
            end_y = y
            break
            
    print(f"Significant content between y={start_y} and y={end_y}")

analyze_columns('assets/idle-sit.png')
