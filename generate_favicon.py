import os
from PIL import Image

def generate_favicons():
    logo_path = r"c:\Users\TECNO\Desktop\Project\investing\CryptoOS\frontend\public\logo.png"
    ico_path = r"c:\Users\TECNO\Desktop\Project\investing\CryptoOS\frontend\public\favicon.ico"
    
    img = Image.open(logo_path).convert("RGBA")
    
    # Save multi-size favicon.ico
    sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save(ico_path, format="ICO", sizes=sizes)
    print(f"Generated favicon.ico from {logo_path} with sizes: {sizes}")

if __name__ == "__main__":
    generate_favicons()
