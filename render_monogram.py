import math
import os
from PIL import Image, ImageDraw

def render_perfect_cryptoos_monogram(output_png_path, size=1024):
    scale = 4
    dim = size * scale
    cx = dim / 2.0
    cy = dim / 2.0

    # Create supersampled transparent image
    img = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Base Geometry Parameters
    r_outer = 430.0 * scale
    r_groove_out = 295.0 * scale
    r_groove_in = 230.0 * scale
    r_inner_disc = 230.0 * scale
    r_core_hole = 75.0 * scale
    channel_half_h = 28.0 * scale

    # Gold metallic gradient generator
    # Linear gradient from top-left (135 deg) to bottom-right (315 deg)
    # with high-end titanium luxury finish
    def get_linear_gold(x, y):
        # Progress along diagonal
        norm = ((x - cx) * 0.7071 + (y - cy) * 0.7071) / r_outer
        # Specular wave
        spec = math.sin(norm * math.pi * 1.5) * 0.5 + 0.5
        r = int(190 + 65 * spec)
        g = int(150 + 90 * spec)
        b = int(45 + 130 * (spec ** 1.7))
        return (min(255, max(0, r)), min(255, max(0, g)), min(255, max(0, b)), 255)

    # 2. Draw Solid Gold Foundation Circle (Outer Radius)
    # We can create a mask to do pure boolean cuts!
    mask = Image.new("L", (dim, dim), 0)
    mask_draw = ImageDraw.Draw(mask)

    # A) Solid outer circle
    mask_draw.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], fill=255)

    # B) Cut out the concentric groove (the white ring in the reference)
    mask_draw.ellipse([cx - r_groove_out, cy - r_groove_out, cx + r_groove_out, cy + r_groove_out], fill=0)

    # C) Add back the inner solid disc
    mask_draw.ellipse([cx - r_inner_disc, cy - r_inner_disc, cx + r_inner_disc, cy + r_inner_disc], fill=255)

    # D) Cut out the center core hole (small circle in center)
    mask_draw.ellipse([cx - r_core_hole, cy - r_core_hole, cx + r_core_hole, cy + r_core_hole], fill=0)

    # E) Cut out horizontal keyhole channel from center hole to right edge
    # In reference: a horizontal slot with rounded or clean ends
    mask_draw.rounded_rectangle(
        [cx - 5*scale, cy - channel_half_h, cx + r_outer + 20*scale, cy + channel_half_h],
        radius=int(channel_half_h),
        fill=0
    )

    # F) Cut out the outer 'C' mouth on the right side
    # Angles: -30 deg to +30 deg on outer ring only (outside r_groove_out)
    # We can do this with pie slice on outer ring
    mouth_mask = Image.new("L", (dim, dim), 0)
    mouth_draw = ImageDraw.Draw(mouth_mask)
    mouth_draw.pieslice(
        [cx - r_outer - 10*scale, cy - r_outer - 10*scale, cx + r_outer + 10*scale, cy + r_outer + 10*scale],
        start=-32, end=32, fill=255
    )
    # But only outside r_groove_out
    mouth_draw.ellipse([cx - r_groove_out, cy - r_groove_out, cx + r_groove_out, cy + r_groove_out], fill=0)

    # Subtract mouth from main mask
    # For every pixel in mouth_mask, clear in mask
    mask.paste(0, (0, 0), mouth_mask)

    # Rounded endcaps on outer C terminals for ultra-clean finish
    cap_r = (r_outer - r_groove_out) / 2.0
    cap_center = (r_outer + r_groove_out) / 2.0
    for deg in [-32.0, 32.0]:
        rad = math.radians(deg)
        ccx = cx + cap_center * math.cos(rad)
        ccy = cy + cap_center * math.sin(rad)
        mask_draw.ellipse([ccx - cap_r, ccy - cap_r, ccx + cap_r, ccy + cap_r], fill=255)

    # 3. Create the Gold Surface Image
    gold_surface = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    gold_draw = ImageDraw.Draw(gold_surface)

    # Render smooth gold gradient
    for y in range(0, int(dim), int(2 * scale)):
        t = y / float(dim)
        spec = math.sin(t * math.pi * 1.8 + 0.3) * 0.5 + 0.5
        r = int(190 + 65 * spec)
        g = int(150 + 90 * spec)
        b = int(45 + 130 * (spec ** 1.8))
        gold_draw.rectangle([0, y, dim, y + int(2 * scale)], fill=(r, g, b, 255))

    # Apply the boolean mask to the gold surface
    gold_surface.putalpha(mask)

    # 4. Add High-Tech Quantum Core (Electric Cyan Node in center)
    # Centered in the cut-out core hole
    cyan_glow = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    cyan_draw = ImageDraw.Draw(cyan_glow)
    node_r = 46.0 * scale
    cyan_draw.ellipse([cx - node_r, cy - node_r, cx + node_r, cy + node_r], fill=(0, 240, 255, 230))
    node_inner = 28.0 * scale
    cyan_draw.ellipse([cx - node_inner, cy - node_inner, cx + node_inner, cy + node_inner], fill=(255, 255, 255, 255))

    # Composite gold surface and cyan node
    final_composite = Image.alpha_composite(gold_surface, cyan_glow)

    # 5. Downsample with Lanczos filter for pristine anti-aliasing
    final = final_composite.resize((size, size), Image.Resampling.LANCZOS)
    os.makedirs(os.path.dirname(output_png_path), exist_ok=True)
    final.save(output_png_path, "PNG", optimize=True)
    print(f"Generated perfect monogram logo at: {output_png_path}")

if __name__ == "__main__":
    out_file = r"c:\Users\TECNO\Desktop\Project\investing\CryptoOS\frontend\public\logo.png"
    render_perfect_cryptoos_monogram(out_file, size=1024)
