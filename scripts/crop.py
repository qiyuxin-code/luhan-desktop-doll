from PIL import Image, ImageChops
import base64

def process_image():
    image_path = 'assets/idle-sit.png'
    img = Image.open(image_path).convert("RGBA")
    
    # Background to compare against
    bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
    diff = ImageChops.difference(img, bg)
    bbox = diff.getbbox()
    
    if bbox:
        print("Original size:", img.size)
        print("Bounding box:", bbox)
        
        # User requested to remove white space on the right side.
        # It's better to crop to the bounding box on the right, but maybe keep original top/bottom/left?
        # Let's just crop to the full bbox.
        cropped = img.crop(bbox)
        
        # Make white pixels transparent
        data = cropped.getdata()
        new_data = []
        for item in data:
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
                
        cropped.putdata(new_data)
        
        # Save as png first
        cropped.save('assets/idle-sit-cropped.png')
        
        # Convert to base64
        with open('assets/idle-sit-cropped.png', 'rb') as f:
            b64_str = base64.b64encode(f.read()).decode('utf-8')
            
        # Create SVG
        svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {cropped.width} {cropped.height}">
    <image width="{cropped.width}" height="{cropped.height}" href="data:image/png;base64,{b64_str}" />
</svg>'''
        
        with open('assets/idle-sit.svg', 'w') as f:
            f.write(svg_content)
        print("Successfully created assets/idle-sit.svg")
    else:
        print("Image is entirely white!")

process_image()