import base64

def generate_identical_svg():
    png_path = r"c:\Users\TECNO\Desktop\Project\investing\CryptoOS\frontend\public\logo.png"
    svg_path = r"c:\Users\TECNO\Desktop\Project\investing\CryptoOS\frontend\public\logo.svg"
    
    with open(png_path, "rb") as f:
        png_b64 = base64.b64encode(f.read()).decode("utf-8")
        
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
  <image href="data:image/png;base64,{png_b64}" width="1024" height="1024" />
</svg>'''

    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Updated {svg_path} with 100% pixel-identical embedded PNG")

if __name__ == "__main__":
    generate_identical_svg()
