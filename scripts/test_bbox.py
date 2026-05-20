from PIL import Image

def get_bbox(image_path, threshold):
    img = Image.open(image_path).convert("RGB")
    data = img.load()
    width, height = img.size
    
    min_x, min_y = width, height
    max_x, max_y = 0, 0
    
    found = False
    for y in range(height):
        for x in range(width):
            r, g, b = data[x, y]
            if r < threshold or g < threshold or b < threshold:
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
                found = True
                
    if found:
        return (min_x, min_y, max_x + 1, max_y + 1)
    return None

for f in ['assets/bubble.png', 'assets/flower.png', 'assets/jump.png']:
    bbox = get_bbox(f, 250)
    print(f, bbox)
