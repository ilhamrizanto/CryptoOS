import math
import os
from PIL import Image, ImageDraw, ImageFilter

def create_refined_cryptoos_logo(output_png_path, size=1024):
    scale = 4  # 4x supersampling for ultra-crisp, anti-aliased rendering
    dim = size * scale
    cx = dim / 2.0
    cy = dim / 2.0

    img = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Balanced geometric dimensions (in scaled px):
    # Outer C
    r_c_out = 430.0 * scale
    r_c_in  = 300.0 * scale
    c_gap   = 32.0   # Gap half-angle in degrees (total gap = 64 deg)
    c_start = c_gap
    c_end   = 360.0 - c_gap

    # Middle O ring (concentric, perfectly spaced in the negative space)
    r_o_out = 265.0 * scale
    r_o_in  = 205.0 * scale

    # Inner Core Hub & Horizontal Keyhole Arm
    r_hub   = 165.0 * scale
    r_hub_hole = 75.0 * scale
    bar_half_h = 28.0 * scale
    bar_x_end  = cx + 335.0 * scale

    # Multi-stop luxury metallic gold shader
    def get_gold_color(angle_rad, specular_offset=0.0):
        # 2 smooth metallic reflection points
        spec = math.sin(angle_rad * 2.0 + specular_offset) * 0.5 + 0.5
        # Base: #D4AF37, Highlight: #FFF2C2, Shadow: #A17918
        r = int(185 + 70 * spec)
        g = int(145 + 95 * spec)
        b = int(40 + 130 * (spec ** 1.8))
        return (min(255, max(0, r)), min(255, max(0, g)), min(255, max(0, b)), 255)

    # 1. DRAW OUTER 'C' (Bold sweeping crescent)
    steps = 1440
    for i in range(steps):
        t1 = i / float(steps)
        t2 = (i + 1) / float(steps)
        deg1 = c_start + t1 * (c_end - c_start)
        deg2 = c_start + t2 * (c_end - c_start)
        rad1 = math.radians(deg1)
        rad2 = math.radians(deg2)

        p1 = (cx + r_c_out * math.cos(rad1), cy + r_c_out * math.sin(rad1))
        p2 = (cx + r_c_in * math.cos(rad1), cy + r_c_in * math.sin(rad1))
        p3 = (cx + r_c_in * math.cos(rad2), cy + r_c_in * math.sin(rad2))
        p4 = (cx + r_c_out * math.cos(rad2), cy + r_c_out * math.sin(rad2))

        col = get_gold_color(rad1, specular_offset=0.2)
        draw.polygon([p1, p2, p3, p4], fill=col)

    # Sleek rounded caps on the outer C ends (resembling high-end Apple / Swiss typography)
    cap_r = (r_c_out - r_c_in) / 2.0
    cap_mid = (r_c_out + r_c_in) / 2.0
    for deg in [c_start, c_end]:
        rad = math.radians(deg)
        cap_cx = cx + cap_mid * math.cos(rad)
        cap_cy = cy + cap_mid * math.sin(rad)
        col = get_gold_color(rad, specular_offset=0.2)
        draw.ellipse([cap_cx - cap_r, cap_cy - cap_r, cap_cx + cap_r, cap_cy + cap_r], fill=col)

    # 2. DRAW CONCENTRIC 'O' RING
    for i in range(1440):
        t1 = i / 1440.0
        t2 = (i + 1) / 1440.0
        rad1 = t1 * 2 * math.pi
        rad2 = t2 * 2 * math.pi

        p1 = (cx + r_o_out * math.cos(rad1), cy + r_o_out * math.sin(rad1))
        p2 = (cx + r_o_in * math.cos(rad1), cy + r_o_in * math.sin(rad1))
        p3 = (cx + r_o_in * math.cos(rad2), cy + r_o_in * math.sin(rad2))
        p4 = (cx + r_o_out * math.cos(rad2), cy + r_o_out * math.sin(rad2))

        col = get_gold_color(rad1, specular_offset=1.1)
        draw.polygon([p1, p2, p3, p4], fill=col)

    # 3. DRAW INNER CORE & CONNECTING ARM
    # Draw central solid annular hub
    for i in range(1440):
        t1 = i / 1440.0
        t2 = (i + 1) / 1440.0
        rad1 = t1 * 2 * math.pi
        rad2 = t2 * 2 * math.pi

        p1 = (cx + r_hub * math.cos(rad1), cy + r_hub * math.sin(rad1))
        p2 = (cx + r_hub_hole * math.cos(rad1), cy + r_hub_hole * math.sin(rad1))
        p3 = (cx + r_hub_hole * math.cos(rad2), cy + r_hub_hole * math.sin(rad2))
        p4 = (cx + r_hub * math.cos(rad2), cy + r_hub * math.sin(rad2))

        col = get_gold_color(rad1, specular_offset=2.0)
        draw.polygon([p1, p2, p3, p4], fill=col)

    # Horizontal connector arm reaching through the gap
    # Seamlessly connects the inner hub through the O ring towards the C opening
    bar_col = get_gold_color(0, specular_offset=0.5)
    draw.rounded_rectangle(
        [cx + r_hub_hole - 5*scale, cy - bar_half_h, bar_x_end, cy + bar_half_h],
        radius=int(bar_half_h),
        fill=bar_col
    )

    # Precision central negative space core with cyan quantum singularity dot
    # Clear the center hole
    draw.ellipse([cx - r_hub_hole, cy - r_hub_hole, cx + r_hub_hole, cy + r_hub_hole], fill=(0, 0, 0, 0))

    # Inner cyan quantum glow node (centered)
    cyan_r = 45.0 * scale
    draw.ellipse([cx - cyan_r, cy - cyan_r, cx + cyan_r, cy + cyan_r], fill=(0, 240, 255, 230))
    cyan_inner = 28.0 * scale
    draw.ellipse([cx - cyan_inner, cy - cyan_inner, cx + cyan_inner, cy + cyan_inner], fill=(255, 255, 255, 255))

    # Downsample using high-quality Lanczos resampling for pristine anti-aliasing
    final = img.resize((size, size), Image.Resampling.LANCZOS)
    os.makedirs(os.path.dirname(output_png_path), exist_ok=True)
    final.save(output_png_path, "PNG", optimize=True)
    print(f"Generated refined logo at: {output_png_path}")

if __name__ == "__main__":
    out_file = r"c:\Users\TECNO\Desktop\Project\investing\CryptoOS\frontend\public\logo.png"
    create_refined_cryptoos_logo(out_file, size=1024)
