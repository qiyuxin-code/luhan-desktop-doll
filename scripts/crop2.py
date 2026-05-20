from PIL import Image
import base64

def process_image():
    image_path = 'assets/idle-sit.png'
    img = Image.open(image_path).convert("RGBA")
    
    # We found earlier that max_x is 1097. We can crop to (0, 0, 1100, 2048) to just remove the right side.
    # But let's recalculate max_x just to be safe.
    data = img.load()
    width, height = img.size
    
    max_x = 0
    for y in range(height):
        for x in range(width):
            r, g, b, a = data[x, y]
            if r < 250 or g < 250 or b < 250:
                if x > max_x:
                    max_x = x
                    
    print("max_x is", max_x)
    
    # Let's add a small padding
    crop_width = min(max_x + 50, width)
    
    # We only remove the right side white part, so we keep top, bottom, left as they are (or maybe keep left too, so it's 0 to crop_width)
    bbox = (0, 0, crop_width, height)
    print("Cropping to:", bbox)
    
    cropped = img.crop(bbox)
    
    # Make white background transparent
    cdata = cropped.getdata()
    new_data = []
    for item in cdata:
        # white threshold
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    cropped.putdata(new_data)
    cropped.save('assets/idle-sit-cropped.png')
    
    with open('assets/idle-sit-cropped.png', 'rb') as f:
        b64_str = base64.b64encode(f.read()).decode('utf-8')
        
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{crop_width}" height="{height}" viewBox="0 0 {crop_width} {height}">
    <image width="{crop_width}" height="{height}" href="data:image/png;base64,{b64_str}" />
</svg>'''
    
    with open('assets/idle-sit.svg', 'w') as f:
        f.write(svg_content)
    print("Successfully created assets/idle-sit.svg")

process_image()