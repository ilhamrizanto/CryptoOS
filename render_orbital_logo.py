import math
import os
from PIL import Image, ImageDraw

def render_cos_orbital_logo(output_png_path, size=1024):
    scale = 4  # 4x supersampling for razor-sharp antialiasing
    dim = size * scale
    cx = dim / 2.0
    cy = dim / 2.0

    img = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Dimensional proportions based on reference
    # Outer 'C'
    r_c_outer = 430.0 * scale
    r_c_inner = 310.0 * scale
    gap_deg = 34.0  # Opening on the right side
    c_start = gap_deg
    c_end = 360.0 - gap_deg

    # Middle 'O' ring
    r_o_outer = 270.0 * scale
    r_o_inner = 215.0 * scale

    # Inner 'S' / Core shape
    r_s_outer = 175.0 * scale
    r_s_inner = 100.0 * scale

    # Luxury Metallic Gold Multi-Tone Shader
    def gold_tone(angle_rad, highlight_shift=0.0):
        # 2 specular highlights for metallic sheen
        val = math.sin(angle_rad * 2.0 + highlight_shift) * 0.5 + 0.5
        # Deep gold to bright champagne gold
        r = int(195 + 60 * val)
        g = int(150 + 85 * val)
        b = int(45 + 130 * (val ** 1.6))
        return (min(255, max(0, r)), min(255, max(0, g)), min(255, max(0, b)), 255)

    # 1. DRAW OUTER 'C'
    steps = 1440
    for i in range(steps):
        t1 = i / float(steps)
        t2 = (i + 1) / float(steps)
        deg1 = c_start + t1 * (c_end - c_start)
        deg2 = c_start + t2 * (c_end - c_start)
        rad1 = math.radians(deg1)
        rad2 = math.radians(deg2)

        p1 = (cx + r_c_outer * math.cos(rad1), cy + r_c_outer * math.sin(rad1))
        p2 = (cx + r_c_inner * math.cos(rad1), cy + r_c_inner * math.sin(rad1))
        p3 = (cx + r_c_inner * math.cos(rad2), cy + r_c_inner * math.sin(rad2))
        p4 = (cx + r_c_outer * math.cos(rad2), cy + r_c_outer * math.sin(rad2))

        col = gold_tone(rad1, highlight_shift=0.3)
        draw.polygon([p1, p2, p3, p4], fill=col)

    # Terminal cuts on outer C: Precision 45-degree angled chamfers
    for deg, is_top in [(c_start, False), (c_end, True)]:
        rad = math.radians(deg)
        x_out = cx + r_c_outer * math.cos(rad)
        y_out = cy + r_c_outer * math.sin(rad)
        x_in = cx + r_c_inner * math.cos(rad)
        y_in = cy + r_c_inner * math.sin(rad)
        col = gold_tone(rad, highlight_shift=0.3)
        draw.line([(x_out, y_out), (x_in, y_in)], fill=col, width=int(12 * scale))

    # 2. DRAW CONCENTRIC 'O' RING
    for i in range(1440):
        t1 = i / 1440.0
        t2 = (i + 1) / 1440.0
        rad1 = t1 * 2 * math.pi
        rad2 = t2 * 2 * math.pi

        p1 = (cx + r_o_outer * math.cos(rad1), cy + r_o_outer * math.sin(rad1))
        p2 = (cx + r_o_inner * math.cos(rad1), cy + r_o_inner * math.sin(rad1))
        p3 = (cx + r_o_inner * math.cos(rad2), cy + r_o_inner * math.sin(rad2))
        p4 = (cx + r_o_outer * math.cos(rad2), cy + r_o_outer * math.sin(rad2))

        col = gold_tone(rad1, highlight_shift=1.2)
        draw.polygon([p1, p2, p3, p4], fill=col)

    # 3. DRAW INNER CORE / 'S' CONNECTOR (Original Interpretation)
    # The inner shape consists of a bold central circular disc with an 'S' negative space wave
    # and a horizontal data bus connector reaching out into the right gap
    r_core_disc = 175.0 * scale
    r_inner_hole = 70.0 * scale

    # Draw inner golden disc (crescent-like that wraps and extends toward the right gap)
    for i in range(1000):
        t1 = i / 1000.0
        t2 = (i + 1) / 1000.0
        # Crescent angle from 40 deg to 320 deg
        deg1 = 40.0 + t1 * (320.0 - 40.0)
        deg2 = 40.0 + t2 * (320.0 - 40.0)
        rad1 = math.radians(deg1)
        rad2 = math.radians(deg2)

        p1 = (cx + r_core_disc * math.cos(rad1), cy + r_core_disc * math.sin(rad1))
        p2 = (cx + r_inner_hole * math.cos(rad1), cy + r_inner_hole * math.sin(rad1))
        p3 = (cx + r_inner_hole * math.cos(rad2), cy + r_inner_hole * math.sin(rad2))
        p4 = (cx + r_core_disc * math.cos(rad2), cy + r_core_disc * math.sin(rad2))

        col = gold_tone(rad1, highlight_shift=2.0)
        draw.polygon([p1, p2, p3, p4], fill=col)

    # Horizontal connector bar extending through the gap
    bar_half_h = 32.0 * scale
    bar_x_start = cx - 20.0 * scale
    bar_x_end = cx + 330.0 * scale  # extends past the O ring into the C gap
    col_bar = gold_tone(0, highlight_shift=0.8)
    draw.rounded_rectangle(
        [bar_x_start, cy - bar_half_h, bar_x_end, cy + bar_half_h],
        radius=int(bar_half_h),
        fill=col_bar
    )

    # Central Quantum Core Node (White & Electric Cyan glow dot)
    node_r = 52.0 * scale
    draw.ellipse([cx - node_r, cy - node_r, cx + node_r, cy + node_r], fill=(0, 240, 255, 230))
    node_inner_r = 34.0 * scale
    draw.ellipse([cx - node_inner_r, cy - node_inner_r, cx + node_inner_r, cy + node_inner_r], fill=(255, 255, 255, 255))

    # Outer accent ring on the central node
    node_ring_r = 65.0 * scale
    draw.ellipse([cx - node_ring_r, cy - node_ring_r, cx + node_ring_r, cy + node_ring_r], outline=(255, 235, 160, 220), width=int(5 * scale))

    # Downsample using high-quality Lanczos resampling for pristine edges
    final = img.resize((size, size), Image.Resampling.LANCZOS)
    os.makedirs(os.path.dirname(output_png_path), exist_ok=True)
    final.save(output_png_path, "PNG", optimize=True)
    print(f"Saved new orbital logo to {output_png_path}")

if __name__ == "__main__":
    out_file = r"c:\Users\TECNO\Desktop\Project\investing\CryptoOS\frontend\public\logo.png"
    render_cos_orbital_logo(out_file, size=1024)
