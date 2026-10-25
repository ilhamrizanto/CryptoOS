import math
import os
from PIL import Image, ImageDraw, ImageFilter

def create_modern_cryptoos_logo(output_png_path, size=1024):
    # Create high-res 4x supersampled canvas for ultra-smooth anti-aliasing
    scale = 2
    actual_size = size * scale
    img = Image.new("RGBA", (actual_size, actual_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = actual_size / 2
    cy = actual_size / 2

    # Dimensions
    r_outer = 400 * scale
    r_inner = 300 * scale
    r_core = 160 * scale

    # Angles for stylized open 'C' (e.g. from 45 deg to 315 deg, leaving a 90 deg gap on the right)
    gap_deg = 48
    start_angle = gap_deg
    end_angle = 360 - gap_deg

    # Outer ambient cyan glow layer
    glow_img = Image.new("RGBA", (actual_size, actual_size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)

    # Draw cyan glow arc behind the C
    bbox_glow = (cx - r_outer - 25*scale, cy - r_outer - 25*scale, cx + r_outer + 25*scale, cy + r_outer + 25*scale)
    glow_draw.arc(bbox_glow, start=start_angle - 5, end=end_angle + 5, fill=(0, 240, 255, 60), width=int(130 * scale))
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=30 * scale))
    img.alpha_composite(glow_img)

    # Draw outer layered gold C ring using smooth polygon strips
    steps = 400
    for i in range(steps):
        t = i / (steps - 1)
        angle_deg = start_angle + t * (end_angle - start_angle)
        rad = math.radians(angle_deg)
        rad_next = math.radians(angle_deg + (end_angle - start_angle) / steps * 1.05)

        # Luxury Gold Gradient: Bright highlight at top, rich antique gold at base
        # Cycle through gold tones
        phase = math.sin(rad * 1.5) * 0.5 + 0.5
        gold_r = int(245 * phase + 195 * (1 - phase))
        gold_g = int(210 * phase + 155 * (1 - phase))
        gold_b = int(115 * phase + 45 * (1 - phase))
        alpha = 255

        # Outer arc segment
        x1 = cx + r_outer * math.cos(rad)
        y1 = cy + r_outer * math.sin(rad)
        x2 = cx + r_inner * math.cos(rad)
        y2 = cy + r_inner * math.sin(rad)

        x3 = cx + r_inner * math.cos(rad_next)
        y3 = cy + r_inner * math.sin(rad_next)
        x4 = cx + r_outer * math.cos(rad_next)
        y4 = cy + r_outer * math.sin(rad_next)

        draw.polygon([(x1, y1), (x2, y2), (x3, y3), (x4, y4)], fill=(gold_r, gold_g, gold_b, alpha))

    # Beveled high-tech inner chamfer accent on the C (hailine gold wire)
    r_bevel = (r_outer + r_inner) / 2
    bbox_bevel = (cx - r_bevel, cy - r_bevel, cx + r_bevel, cy + r_bevel)
    draw.arc(bbox_bevel, start=start_angle, end=end_angle, fill=(255, 245, 190, 220), width=int(6 * scale))

    # Outer and inner border outlines for crisp vector precision
    bbox_out = (cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer)
    draw.arc(bbox_out, start=start_angle, end=end_angle, fill=(255, 230, 140, 240), width=int(5 * scale))
    bbox_in = (cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner)
    draw.arc(bbox_in, start=start_angle, end=end_angle, fill=(180, 135, 30, 240), width=int(5 * scale))

    # Terminal angled caps (cut-off ends of the C)
    for cap_angle, is_top in [(start_angle, False), (end_angle, True)]:
        rad = math.radians(cap_angle)
        x_out = cx + r_outer * math.cos(rad)
        y_out = cy + r_outer * math.sin(rad)
        x_in = cx + r_inner * math.cos(rad)
        y_in = cy + r_inner * math.sin(rad)
        draw.line([(x_out, y_out), (x_in, y_in)], fill=(255, 240, 170, 255), width=int(8 * scale))

    # Draw Central Quantum Trading Kernel (Futuristic Faceted Isometric Hexagon / Diamond Core)
    # 6 vertices of hexagon
    hex_pts = []
    for deg in [30, 90, 150, 210, 270, 330]:
        r = r_core
        hx = cx + r * math.cos(math.radians(deg))
        hy = cy + r * math.sin(math.radians(deg))
        hex_pts.append((hx, hy))

    # Facet 1: Top Right (Cyan highlight)
    draw.polygon([(cx, cy), hex_pts[0], hex_pts[5]], fill=(0, 240, 255, 210))
    # Facet 2: Bottom Right (Deep emerald / teal)
    draw.polygon([(cx, cy), hex_pts[0], hex_pts[1]], fill=(0, 190, 215, 220))
    # Facet 3: Bottom Left (Dark electric blue / slate)
    draw.polygon([(cx, cy), hex_pts[1], hex_pts[2]], fill=(0, 140, 180, 230))
    # Facet 4: Left (Luminous cyan)
    draw.polygon([(cx, cy), hex_pts[2], hex_pts[3]], fill=(0, 215, 240, 200))
    # Facet 5: Top Left (Bright ice-cyan)
    draw.polygon([(cx, cy), hex_pts[3], hex_pts[4]], fill=(80, 245, 255, 240))
    # Facet 6: Top (Pure bright neon)
    draw.polygon([(cx, cy), hex_pts[4], hex_pts[5]], fill=(140, 250, 255, 250))

    # Inner isometric cube wireframe in polished gold
    for pt in hex_pts:
        draw.line([(cx, cy), pt], fill=(255, 235, 150, 240), width=int(5 * scale))

    for k in range(6):
        draw.line([hex_pts[k], hex_pts[(k + 1) % 6]], fill=(255, 245, 180, 255), width=int(7 * scale))

    # Micro-node points at vertices
    for pt in hex_pts:
        nr = 9 * scale
        draw.ellipse((pt[0] - nr, pt[1] - nr, pt[0] + nr, pt[1] + nr), fill=(255, 255, 255, 255), outline=(212, 175, 55, 255), width=int(2 * scale))

    # Central quantum core node (White & Cyan pinpoint)
    cnr = 12 * scale
    draw.ellipse((cx - cnr, cy - cnr, cx + cnr, cy + cnr), fill=(255, 255, 255, 255))
    draw.ellipse((cx - cnr*1.5, cy - cnr*1.5, cx + cnr*1.5, cy + cnr*1.5), outline=(0, 240, 255, 200), width=int(2 * scale))

    # Downsample using high-quality Lanczos resampling for pristine anti-aliasing
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    os.makedirs(os.path.dirname(output_png_path), exist_ok=True)
    final_img.save(output_png_path, "PNG", optimize=True)
    print(f"Successfully generated transparent PNG logo at: {output_png_path}")

if __name__ == "__main__":
    out_path = r"c:\Users\TECNO\Desktop\Project\investing\CryptoOS\frontend\public\logo.png"
    create_modern_cryptoos_logo(out_path, size=1024)
