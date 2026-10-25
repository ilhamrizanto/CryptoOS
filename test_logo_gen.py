import math
import os
from PIL import Image, ImageDraw, ImageFilter

def generate_cos_modern_logo(png_output_path, size=1024):
    scale = 4  # 4x supersampling for razor-sharp vector-grade anti-aliasing
    canvas_size = size * scale
    cx = canvas_size / 2.0
    cy = canvas_size / 2.0

    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Radii (scaled)
    # Outer 'C'
    r_outer_max = 440.0 * scale
    r_outer_min = 320.0 * scale

    # Middle 'O' ring
    r_mid_max = 285.0 * scale
    r_mid_min = 235.0 * scale

    # Inner 'S' core
    r_inner_max = 195.0 * scale
    r_inner_core = 85.0 * scale

    # Gap on right for the outer C (from -36 deg to +36 deg)
    gap_deg = 36.0
    start_angle = gap_deg
    end_angle = 360.0 - gap_deg

    # --- 1. Luxury Gold Palette Gradients ---
    # We can calculate smooth metallic reflections
    def get_gold_color(angle_rad, t_rad=0.5):
        # Multi-stop luxury metallic titanium gold
        # Highlights at 45 deg and 225 deg
        specular = math.sin(angle_rad * 2.0 - 0.5) * 0.5 + 0.5
        # Primary base: #D4AF37 (212, 175, 55)
        # Highlight:    #FFF0B8 (255, 240, 184)
        # Shadow:       #967216 (150, 114, 22)
        r = int(170 + 75 * specular + 10 * t_rad)
        g = int(130 + 95 * specular + 15 * t_rad)
        b = int(35 + 120 * (specular ** 1.8) + 5 * t_rad)
        return (min(255, max(0, r)), min(255, max(0, g)), min(255, max(0, b)), 255)

    # --- 2. Draw Outer 'C' ---
    steps = 720
    for i in range(steps):
        t = i / float(steps)
        deg = start_angle + t * (end_angle - start_angle)
        rad = math.radians(deg)
        deg_next = start_angle + (i + 1) / float(steps) * (end_angle - start_angle)
        rad_next = math.radians(deg_next)

        p1 = (cx + r_outer_max * math.cos(rad), cy + r_outer_max * math.sin(rad))
        p2 = (cx + r_outer_min * math.cos(rad), cy + r_outer_min * math.sin(rad))
        p3 = (cx + r_outer_min * math.cos(rad_next), cy + r_outer_min * math.sin(rad_next))
        p4 = (cx + r_outer_max * math.cos(rad_next), cy + r_outer_max * math.sin(rad_next))

        color = get_gold_color(rad)
        draw.polygon([p1, p2, p3, p4], fill=color)

    # Add terminal endcaps with sleek rounded/chamfered finish on the C
    cap_r = (r_outer_max - r_outer_min) / 2.0
    cap_center_r = (r_outer_max + r_outer_min) / 2.0
    for deg in [start_angle, end_angle]:
        rad = math.radians(deg)
        cap_cx = cx + cap_center_r * math.cos(rad)
        cap_cy = cy + cap_center_r * math.sin(rad)
        color = get_gold_color(rad)
        draw.ellipse([cap_cx - cap_r, cap_cy - cap_r, cap_cx + cap_r, cap_cy + cap_r], fill=color)

    # --- 3. Draw Middle 'O' Ring ---
    # Concentric orbital ring with high-tech negative space breathers
    for i in range(720):
        rad = math.radians(i * 0.5)
        rad_next = math.radians((i + 1) * 0.5)

        p1 = (cx + r_mid_max * math.cos(rad), cy + r_mid_max * math.sin(rad))
        p2 = (cx + r_mid_min * math.cos(rad), cy + r_mid_min * math.sin(rad))
        p3 = (cx + r_mid_min * math.cos(rad_next), cy + r_mid_min * math.sin(rad_next))
        p4 = (cx + r_mid_max * math.cos(rad_next), cy + r_mid_max * math.sin(rad_next))

        # Distinct tone: slightly lighter gold/platinum
        color = get_gold_color(rad + math.pi / 2.0, t_rad=0.8)
        draw.polygon([p1, p2, p3, p4], fill=color)

    # --- 4. Draw Inner 'S' / Core Node ---
    # Centered modern stylized S that connects into an energy dot
    # Upper loop of S:
    s_steps = 360
    # Top crescent of S (from 180 deg to 360 deg)
    for i in range(s_steps):
        t = i / float(s_steps)
        deg = 180.0 + t * 180.0
        rad = math.radians(deg)
        rad_next = math.radians(deg + 180.0 / s_steps)

        # Upper loop center shifted slightly up
        s_cx = cx
        s_cy = cy - 40.0 * scale
        r_s_outer = 120.0 * scale
        r_s_inner = 65.0 * scale

        p1 = (s_cx + r_s_outer * math.cos(rad), s_cy + r_s_outer * math.sin(rad))
        p2 = (s_cx + r_s_inner * math.cos(rad), s_cy + r_s_inner * math.sin(rad))
        p3 = (s_cx + r_s_inner * math.cos(rad_next), s_cy + r_s_inner * math.sin(rad_next))
        p4 = (s_cx + r_s_outer * math.cos(rad_next), s_cy + r_s_outer * math.sin(rad_next))

        color = get_gold_color(rad, t_rad=1.0)
        draw.polygon([p1, p2, p3, p4], fill=color)

    # Lower loop of S (from 0 deg to 180 deg)
    for i in range(s_steps):
        t = i / float(s_steps)
        deg = 0.0 + t * 180.0
        rad = math.radians(deg)
        rad_next = math.radians(deg + 180.0 / s_steps)

        s_cx = cx
        s_cy = cy + 40.0 * scale
        r_s_outer = 120.0 * scale
        r_s_inner = 65.0 * scale

        p1 = (s_cx + r_s_outer * math.cos(rad), s_cy + r_s_outer * math.sin(rad))
        p2 = (s_cx + r_s_inner * math.cos(rad), s_cy + r_s_inner * math.sin(rad))
        p3 = (s_cx + r_s_inner * math.cos(rad_next), s_cy + r_s_inner * math.sin(rad_next))
        p4 = (s_cx + r_s_outer * math.cos(rad_next), s_cy + r_s_outer * math.sin(rad_next))

        color = get_gold_color(rad + math.pi, t_rad=0.3)
        draw.polygon([p1, p2, p3, p4], fill=color)

    # Center quantum singularity node (White-gold core)
    core_r = 38.0 * scale
    draw.ellipse([cx - core_r, cy - core_r, cx + core_r, cy + core_r], fill=(255, 255, 255, 255))
    draw.ellipse([cx - core_r*1.3, cy - core_r*1.3, cx + core_r*1.3, cy + core_r*1.3], outline=(212, 175, 55, 200), width=int(3*scale))

    # Downsample with Lanczos filter for pristine anti-aliased edges
    final = img.resize((size, size), Image.Resampling.LANCZOS)
    os.makedirs(os.path.dirname(png_output_path), exist_ok=True)
    final.save(png_output_path, "PNG", optimize=True)
    print(f"Generated test logo at: {png_output_path}")

if __name__ == "__main__":
    generate_cos_modern_logo("test_logo.png", size=512)
