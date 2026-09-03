"""Bibliothèque de diagrammes techniques (style plan d'architecte).

Chaque fonction accepte un paramètre `progress` (0..1). Pour les catégories
prioritaires (les plus fréquentes dans une narration sur les fondations),
progress<1 anime réellement la construction du diagramme : trait qui se
trace, bâtiment qui bascule, éléments qui apparaissent un à un. Pour les
autres catégories, le paramètre est accepté mais ignoré — 03_render_frames.py
leur applique un fondu d'apparition générique à la place.
"""
import math
import random
from PIL import Image, ImageDraw
import style as S


def _box(box, pad=0):
    x1, y1, x2, y2 = box
    return x1 + pad, y1 + pad, x2 - pad, y2 - pad


def crack_section(img, draw, box, seed=0, progress=1.0, accent=S.ACCENT):
    """Coupe de mur avec fissure diagonale + sol hachuré (le trait de
    fissure se trace progressivement)."""
    x1, y1, x2, y2 = box
    wall_h = (y2 - y1) * 0.62
    wall = (x1 + 120, y1, x2 - 120, y1 + wall_h)
    S.hatch_rect(img, wall, spacing=22, color=S.INK, width=1)
    draw = ImageDraw.Draw(img)
    draw.rectangle(wall, outline=S.INK, width=3)
    rnd = random.Random(seed)
    cx = wall[0] + (wall[2] - wall[0]) * 0.45
    pts = [(cx, wall[1] + 10)]
    y = wall[1] + 10
    while y < wall[3] - 10:
        y += rnd.uniform(28, 46)
        x = pts[-1][0] + rnd.uniform(-38, 38)
        x = max(wall[0] + 15, min(wall[2] - 15, x))
        pts.append((x, min(y, wall[3] - 10)))

    crack_progress = S.stage(progress, 0.05, 0.75)
    visible_pts = S.truncate_polyline(pts, crack_progress)
    if len(visible_pts) >= 2:
        draw.line(visible_pts, fill=accent, width=6, joint="curve")

    ground_y = wall[3]
    draw.line([(x1, ground_y), (x2, ground_y)], fill=S.INK, width=3)
    S.hatch_rect(img, (x1, ground_y, x2, y2), spacing=20, color=S.GRAY, width=1, outline=False)
    draw = ImageDraw.Draw(img)
    if S.stage(progress, 0.8, 0.95) > 0 and len(visible_pts) >= 2:
        mid = pts[len(pts) // 2]
        S.leader(draw, mid[0], mid[1], mid[0] + 90, mid[1] - 40, mid[0] + 110, mid[1] - 40, "fissure > 2 mm", color=accent)


def tilt_elevation(img, draw, box, seed=0, progress=1.0, accent=S.ACCENT):
    """Bâtiment en élévation qui bascule progressivement vers son
    inclinaison finale, avec repère de verticalité."""
    x1, y1, x2, y2 = box
    bw, bh = 340, (y2 - y1) * 0.82
    tile = Image.new("RGBA", (int(bw) + 40, int(bh) + 40), (0, 0, 0, 0))
    td = ImageDraw.Draw(tile)
    td.rectangle([20, 20, 20 + bw, 20 + bh], outline=S.INK, width=3, fill=(255, 255, 255, 255))
    rows, cols = 6, 2
    for r in range(rows):
        for c in range(cols):
            wx = 20 + 40 + c * (bw / cols)
            wy = 20 + 30 + r * (bh / rows)
            ww, wh = bw / cols - 70, bh / rows - 26
            td.rectangle([wx, wy, wx + ww, wy + wh], outline=S.INK, width=2)

    target_angle = 6
    angle = target_angle * S.ease(S.stage(progress, 0.1, 0.65))
    rotated = tile.rotate(-angle, resample=Image.BICUBIC, expand=True, center=(20 + bw / 2, 20 + bh))
    px = int((x1 + x2) / 2 - rotated.width / 2)
    py = int(y1 + bh - (rotated.height - 40) + 10)
    img.paste(rotated, (px, py), rotated)
    draw = ImageDraw.Draw(img)
    ground_y = y1 + bh + 30
    draw.line([(x1, ground_y), (x2, ground_y)], fill=S.INK, width=3)
    S.hatch_rect(img, (x1, ground_y, x2, y2), spacing=20, color=S.GRAY, width=1, outline=False)
    draw = ImageDraw.Draw(img)
    if S.stage(progress, 0.7, 0.9) > 0:
        ref_x = (x1 + x2) / 2 - bw / 2 - 60
        S.dashed_line(draw, ref_x, y1, ref_x, ground_y, color=S.GRAY, width=2)
        S.leader(draw, ref_x, y1 + 30, ref_x - 70, y1 + 30, ref_x - 180, y1 + 30, "hors verticale", color=accent)
        draw.text((ref_x - 150, y1 + 60), f"{target_angle}°", font=S.F_MONO_B(30), fill=accent)


def foundation_plan(img, draw, box, seed=0, progress=1.0, accent=S.ACCENT):
    """Plan de fondation : les semelles hachurées apparaissent une à une,
    en lisant la grille de gauche à droite puis de haut en bas."""
    x1, y1, x2, y2 = box
    pad = 60
    gx1, gy1, gx2, gy2 = x1 + pad, y1 + 40, x2 - pad, y2 - 60
    cols, rows = 3, 3
    fs = 92
    xs = [gx1 + i * (gx2 - gx1) / (cols - 1) for i in range(cols)]
    ys = [gy1 + i * (gy2 - gy1) / (rows - 1) for i in range(rows)]
    S.dashed_line(draw, xs[0], ys[0], xs[-1], ys[0], color=S.GRAY)
    S.dashed_line(draw, xs[0], ys[-1], xs[-1], ys[-1], color=S.GRAY)
    S.dashed_line(draw, xs[0], ys[0], xs[0], ys[-1], color=S.GRAY)
    S.dashed_line(draw, xs[-1], ys[0], xs[-1], ys[-1], color=S.GRAY)

    build_progress = S.stage(progress, 0.05, 0.75)
    total = rows * cols
    shown = min(total, int(build_progress * total + 0.999))
    grid_pts = [(xi, yi) for yi in range(rows) for xi in range(cols)]

    for yy in ys:
        draw.line([(xs[0], yy), (xs[-1], yy)], fill=S.INK, width=2)
    for xx in xs:
        for i in range(len(ys) - 1):
            draw.line([(xx, ys[i]), (xx, ys[i + 1])], fill=S.INK, width=2)

    last_pos = None
    for idx in range(shown):
        xi, yi = grid_pts[idx]
        xx, yy = xs[xi], ys[yi]
        S.hatch_rect(img, (xx - fs / 2, yy - fs / 2, xx + fs / 2, yy + fs / 2), spacing=14)
        last_pos = (xx, yy)
    draw = ImageDraw.Draw(img)
    if S.stage(progress, 0.85, 0.98) > 0:
        S.leader(draw, xs[-1], ys[0], xs[-1] + 40, ys[0] + 70, xs[-1] + 60, ys[0] + 70,
                  "S1 : semelle 1.10 x 1.10", color=accent)


def rebar_detail(img, draw, box, seed=0, progress=1.0, accent=S.ACCENT):
    """Coupe d'une semelle en béton armé : les armatures apparaissent de
    gauche à droite."""
    x1, y1, x2, y2 = box
    fw, fh = 420, 110
    fx, fy = (x1 + x2) / 2 - fw / 2, y1 + 260
    S.concrete_band(draw, (fx, fy, fx + fw, fy + fh))
    draw = ImageDraw.Draw(img)
    n = 8
    rebar_progress = S.stage(progress, 0.15, 0.7)
    shown = int(rebar_progress * n + 0.999)
    for i in range(min(shown, n)):
        cx = fx + 20 + i * (fw - 40) / (n - 1)
        draw.ellipse([cx - 7, fy + 22, cx + 7, fy + 36], outline=accent, width=3)
        draw.ellipse([cx - 7, fy + fh - 36, cx + 7, fy + fh - 22], outline=accent, width=3)

    ground_y = fy + fh
    S.hatch_rect(img, (x1, ground_y, fx, y2), spacing=18, color=S.GRAY, width=1, outline=False)
    S.hatch_rect(img, (fx + fw, ground_y, x2, y2), spacing=18, color=S.GRAY, width=1, outline=False)
    draw = ImageDraw.Draw(img)
    draw.rectangle((x1, ground_y, x2, y2), outline=S.INK, width=2)
    if S.stage(progress, 0.75, 0.95) > 0:
        S.dim_line(draw, fx, fy + fh + 50, fx + fw, fy + fh + 50, "1.10 m")
        S.leader(draw, fx + fw * 0.25, fy + 29, fx - 90, fy - 60, fx - 220, fy - 60, "armature HA12", color=accent)


def drilling_rig(img, draw, box, seed=0, progress=1.0, accent=S.ACCENT):
    """Sondage géotechnique : les couches de sol apparaissent de haut en
    bas, puis le forage descend progressivement."""
    x1, y1, x2, y2 = box
    ground_y = y1 + 260
    draw.line([(x1, ground_y), (x2, ground_y)], fill=S.INK, width=3)
    layers = [(ground_y, ground_y + 180, "remblai"), (ground_y + 180, ground_y + 340, "argile"),
              (ground_y + 340, y2, "sable compact")]
    layer_progress = S.stage(progress, 0.05, 0.5)
    shown = int(layer_progress * len(layers) + 0.999)
    for (a, b, name) in layers[:shown]:
        S.hatch_rect(img, (x1, a, x2, b), spacing=20, color=S.GRAY, width=1)
        draw = ImageDraw.Draw(img)
        draw.text((x1 + 16, (a + b) / 2 - 14), name, font=S.F_MONO(24), fill=S.INK)

    cx = (x1 + x2) / 2
    mast_top = y1 + 40
    if S.stage(progress, 0.05, 0.2) > 0:
        draw.polygon([(cx - 14, mast_top), (cx + 14, mast_top), (cx + 6, ground_y), (cx - 6, ground_y)],
                     outline=S.INK, width=3)
        draw.line([(cx - 60, mast_top - 20), (cx, mast_top), (cx + 60, mast_top - 20)], fill=S.INK, width=3)

    depth_progress = S.ease(S.stage(progress, 0.5, 0.9))
    rod_bottom = ground_y + (y2 - 20 - ground_y) * depth_progress
    if rod_bottom > ground_y:
        draw.line([(cx, ground_y), (cx, rod_bottom)], fill=accent, width=5)
    if S.stage(progress, 0.85, 0.98) > 0:
        S.dim_line(draw, cx + 90, ground_y, cx + 90, y2 - 20, "P = 4.2 m")


def soil_layers(img, draw, box, seed=0, progress=1.0, accent=S.ACCENT):
    """Coupe stratigraphique du sol : les couches se déposent de haut en
    bas."""
    x1, y1, x2, y2 = box
    top = y1 + 80
    layers = [(top, top + 130, "terre végétale"), (top + 130, top + 330, "argile gonflante"),
              (top + 330, top + 520, "sable"), (top + 520, y2, "roche mère")]
    layer_progress = S.stage(progress, 0.05, 0.85)
    shown = int(layer_progress * len(layers) + 0.999)
    for (a, b, name) in layers[:shown]:
        S.hatch_rect(img, (x1, a, x2, b), spacing=18, color=S.GRAY, width=1)
        draw = ImageDraw.Draw(img)
        tw = draw.textlength(name, font=S.F_MONO_B(26))
        draw.rectangle((x1 + 10, (a + b) / 2 - 18, x1 + 30 + tw, (a + b) / 2 + 12), fill=S.BG)
        draw.text((x1 + 20, (a + b) / 2 - 14), name, font=S.F_MONO_B(26), fill=S.INK)
    if shown > 0:
        draw.rectangle((x1, y1 + 40, x2, top), outline=S.INK, width=2)


def water_infiltration(img, draw, box, seed=0, progress=1.0, accent=S.ACCENT):
    """Infiltration d'eau vers la fondation."""
    x1, y1, x2, y2 = box
    ground_y = y1 + 100
    S.hatch_rect(img, (x1, ground_y, x2, y2), spacing=20, color=S.GRAY, width=1)
    draw = ImageDraw.Draw(img)
    water_y = ground_y + 260
    for xw in range(int(x1), int(x2), 40):
        draw.arc([xw, water_y - 10, xw + 40, water_y + 10], 200, 340, fill=accent, width=3)
    tw = draw.textlength("nappe phréatique", font=S.F_MONO_B(26))
    draw.rectangle((x2 - tw - 30, water_y - 40, x2 - 10, water_y - 8), fill=S.BG)
    draw.text((x2 - tw - 20, water_y - 36), "nappe phréatique", font=S.F_MONO_B(26), fill=accent)
    fw = 220
    S.concrete_band(draw, ((x1 + x2) / 2 - fw / 2, ground_y - 40, (x1 + x2) / 2 + fw / 2, ground_y + 40))
    for i in range(4):
        ax = (x1 + x2) / 2 - fw / 2 - 40 - i * 30
        S.arrow(draw, ax, water_y + 60, ax + 60, ground_y + 30, color=accent, width=3, head=10)


def collapse_elevation(img, draw, box, seed=0, progress=1.0, accent=S.ACCENT):
    """Bâtiment effondré / rupture structurelle."""
    x1, y1, x2, y2 = box
    ground_y = y2 - 40
    draw.line([(x1, ground_y), (x2, ground_y)], fill=S.INK, width=3)
    S.hatch_rect(img, (x1, ground_y, x2, y2), spacing=20, color=S.GRAY, width=1, outline=False)
    rnd = random.Random(seed)
    blocks = [(-160, -30, 150, 260), (-30, 60, 130, 200), (60, 210, 170, 150)]
    cx = (x1 + x2) / 2
    for (dx1, dx2, h, w) in blocks:
        bx1, bx2 = cx + dx1, cx + dx1 + w
        by2 = ground_y - rnd.uniform(0, 20)
        by1 = by2 - h
        angle = rnd.uniform(-10, 10)
        tile = Image.new("RGBA", (int(w) + 20, int(h) + 20), (0, 0, 0, 0))
        td = ImageDraw.Draw(tile)
        td.rectangle([10, 10, 10 + w, 10 + h], outline=S.INK, width=3, fill=(255, 255, 255, 255))
        rot = tile.rotate(angle, resample=Image.BICUBIC, expand=True)
        img.paste(rot, (int(bx1 - 10), int(by1 - 10)), rot)
    draw = ImageDraw.Draw(img)
    for _ in range(10):
        rx = cx + rnd.uniform(-220, 220)
        ry = ground_y - rnd.uniform(0, 20)
        rs = rnd.uniform(6, 18)
        draw.polygon([(rx, ry), (rx + rs, ry - rs * 0.6), (rx + rs * 1.4, ry)], outline=S.INK, width=2)


def inspection_detail(img, draw, box, seed=0, progress=1.0, accent=S.ACCENT):
    """Inspection d'une fissure avec jauge de mesure."""
    x1, y1, x2, y2 = box
    wall = (x1 + 100, y1 + 60, x2 - 100, y2 - 120)
    S.hatch_rect(img, wall, spacing=24, color=S.GRAY, width=1)
    draw = ImageDraw.Draw(img)
    cx = (wall[0] + wall[2]) / 2
    draw.line([(cx - 10, wall[1] + 20), (cx + 30, wall[3] - 20)], fill=accent, width=6)
    gx, gy = cx + 60, (wall[1] + wall[3]) / 2
    draw.rectangle([gx, gy - 18, gx + 140, gy + 18], outline=S.INK, width=3, fill=S.BG)
    for i in range(6):
        xx = gx + 10 + i * 22
        draw.line([(xx, gy - 18), (xx, gy - 6)], fill=S.INK, width=2)
    S.leader(draw, gx + 70, gy, gx + 70, gy - 80, gx + 90, gy - 80, "jauge fissurométrique", color=accent)


def site_plan(img, draw, box, seed=0, progress=1.0, accent=S.ACCENT):
    """Plan de situation : parcelle et voirie."""
    x1, y1, x2, y2 = box
    cx = (x1 + x2) / 2
    road_w = 90
    draw.rectangle([cx - road_w / 2, y1 + 40, cx + road_w / 2, y2 - 40], fill=S.FILL_LIGHT, outline=S.INK, width=2)
    road_h_y = y1 + (y2 - y1) * 0.42
    draw.rectangle([x1, road_h_y - road_w / 2, x2, road_h_y + road_w / 2], fill=S.FILL_LIGHT, outline=S.INK, width=2)
    S.dashed_line(draw, x1, road_h_y, x2, road_h_y, color=S.GRAY)
    lots = [(x1 + 40, y1 + 40, cx - road_w / 2 - 30, road_h_y - road_w / 2 - 30),
            (cx + road_w / 2 + 30, y1 + 40, x2 - 40, road_h_y - road_w / 2 - 30),
            (cx + road_w / 2 + 30, road_h_y + road_w / 2 + 30, x2 - 40, y2 - 40)]
    for lot in lots:
        draw.rectangle(lot, fill=S.FILL_LIGHT, outline=S.INK, width=2)
    plot = (x1 + 40, road_h_y + road_w / 2 + 30, cx - road_w / 2 - 30, y2 - 40)
    S.hatch_rect(img, plot, spacing=16, color=accent, width=2)
    draw = ImageDraw.Draw(img)
    draw.rectangle(plot, outline=accent, width=4)
    S.leader(draw, plot[0] + (plot[2] - plot[0]) / 2, plot[3], plot[0] + (plot[2] - plot[0]) / 2, plot[3] + 40,
             plot[0] + (plot[2] - plot[0]) / 2 + 20, plot[3] + 40, "terrain à bâtir", color=accent)


def document_icon(img, draw, box, seed=0, progress=1.0, accent=S.ACCENT):
    """Document / norme technique (cartouche de plan)."""
    x1, y1, x2, y2 = box
    dw, dh = 320, 420
    dx, dy = (x1 + x2) / 2 - dw / 2, y1 + 60
    draw.rectangle([dx, dy, dx + dw, dy + dh], outline=S.INK, width=3, fill=S.BG)
    for i in range(7):
        ly = dy + 50 + i * 40
        w = dw - 60 if i % 3 else dw - 140
        draw.line([(dx + 30, ly), (dx + 30 + w, ly)], fill=S.GRAY, width=4)
    draw.rectangle([dx + 30, dy + dh - 70, dx + dw - 30, dy + dh - 30], outline=accent, width=3)
    draw.text((dx + 46, dy + dh - 62), "DTU 13.12", font=S.F_MONO_B(24), fill=accent)
    S.leader(draw, dx + dw, dy + 80, dx + dw + 60, dy + 40, dx + dw + 80, dy + 40, "norme en vigueur", color=accent)


def excavation_section(img, draw, box, seed=0, progress=1.0, accent=S.ACCENT):
    """Coupe de fouille de terrassement."""
    x1, y1, x2, y2 = box
    ground_y = y1 + 60
    S.hatch_rect(img, (x1, ground_y, x2, y2), spacing=20, color=S.GRAY, width=1)
    draw = ImageDraw.Draw(img)
    pit_w = (x2 - x1) * 0.5
    pit_h = (y2 - y1) * 0.55
    px1, px2 = (x1 + x2) / 2 - pit_w / 2, (x1 + x2) / 2 + pit_w / 2
    py2 = ground_y + pit_h
    draw.rectangle([px1, ground_y, px2, py2], fill=S.BG, outline=S.INK, width=3)
    for xw in range(int(px1) + 20, int(px2), 60):
        S.dashed_line(draw, xw, ground_y + 10, xw, py2 - 10, color=S.GRAY_LIGHT, width=1)
    S.dim_line(draw, px1, ground_y - 30, px2, ground_y - 30, "fouille en pleine masse")
    S.dim_line(draw, px2 + 50, ground_y, px2 + 50, py2, "2.2 m")
    draw.line([(x1, ground_y), (x2, ground_y)], fill=S.INK, width=3)


def pile_section(img, draw, box, seed=0, progress=1.0, accent=S.ACCENT):
    """Bâtiment sur fondations profondes (pieux)."""
    x1, y1, x2, y2 = box
    bw, bh = 300, 160
    bx, by = (x1 + x2) / 2 - bw / 2, y1 + 40
    draw.rectangle([bx, by, bx + bw, by + bh], outline=S.INK, width=3)
    ground_y = by + bh
    draw.line([(x1, ground_y), (x2, ground_y)], fill=S.INK, width=3)
    S.hatch_rect(img, (x1, ground_y, x2, y2), spacing=20, color=S.GRAY, width=1, outline=False)
    draw = ImageDraw.Draw(img)
    n = 3
    pile_bottom = y2 - 60
    for i in range(n):
        px = bx + bw * (i + 0.5) / n
        draw.rectangle([px - 14, ground_y, px + 14, pile_bottom], outline=accent, width=3)
    S.dim_line(draw, bx + bw + 40, ground_y, bx + bw + 40, pile_bottom, "L = 12 m")
    S.leader(draw, bx + bw / 2, ground_y, bx + bw / 2 + 60, ground_y + 30, bx + bw / 2 + 80, ground_y + 30,
             "pieux forés", color=accent)


def retaining_wall_section(img, draw, box, seed=0, progress=1.0, accent=S.ACCENT):
    """Mur de soutènement sous poussée des terres."""
    x1, y1, x2, y2 = box
    wall_x = (x1 + x2) / 2 + 40
    wall_top, wall_bot = y1 + 40, y2 - 80
    ground_y = y1 + 320
    bulge = 24
    pts = [(wall_x, wall_top)]
    steps = 12
    for i in range(1, steps + 1):
        t = i / steps
        curve = math.sin(t * math.pi) * bulge
        pts.append((wall_x + curve, wall_top + t * (wall_bot - wall_top)))
    pts2 = [(wall_x - 40, wall_bot), (wall_x - 40, wall_top)]
    draw.polygon(pts + pts2, outline=S.INK, width=3, fill=S.FILL_LIGHT)
    S.hatch_rect(img, (x1, ground_y, wall_x - 40, wall_bot), spacing=20, color=S.GRAY, width=1, outline=False)
    draw = ImageDraw.Draw(img)
    draw.rectangle((x1, ground_y, wall_x - 40, wall_bot), outline=S.INK, width=2)
    for yy in range(int(ground_y + 30), int(wall_bot) - 20, 55):
        S.arrow(draw, x1 + 20, yy, wall_x - 55, yy, color=accent, width=3, head=10)
    draw.line([(x1, wall_bot), (x2, wall_bot)], fill=S.INK, width=3)
    S.hatch_rect(img, (x1, wall_bot, x2, y2), spacing=20, color=S.GRAY, width=1, outline=False)
    draw = ImageDraw.Draw(img)
    draw.rectangle((x1, wall_bot, x2, y2), outline=S.INK, width=2)
    S.leader(draw, wall_x + 10, ground_y + 60, wall_x + 90, ground_y + 20, wall_x + 110, ground_y + 20,
             "poussée des terres", color=accent)


CATEGORY_DIAGRAM = {
    "crack": crack_section,
    "settlement": tilt_elevation,
    "foundation": foundation_plan,
    "concrete": rebar_detail,
    "drilling": drilling_rig,
    "clay": soil_layers,
    "water": water_infiltration,
    "collapse": collapse_elevation,
    "engineer": inspection_detail,
    "blueprint": document_icon,
    "site": site_plan,
    "code": document_icon,
    "excavation": excavation_section,
    "pile": pile_section,
    "retaining_wall": retaining_wall_section,
}

# Ces catégories ont une vraie animation de construction interne (progress
# contrôle le tracé). Les autres reçoivent un fondu générique à l'appel.
ANIMATED_CATEGORIES = {"crack", "settlement", "foundation", "concrete", "drilling", "clay"}

FALLBACK_CYCLE = [tilt_elevation, crack_section, soil_layers, drilling_rig,
                  rebar_detail, foundation_plan, inspection_detail, site_plan]
FALLBACK_CATEGORY_NAMES = ["settlement", "crack", "clay", "drilling",
                            "concrete", "foundation", "engineer", "site"]


def resolve_diagram(category, fallback_index):
    """Retourne (fonction_de_dessin, catégorie_effective, est_animée)."""
    fn = CATEGORY_DIAGRAM.get(category)
    if fn is not None:
        return fn, category, category in ANIMATED_CATEGORIES
    idx = fallback_index % len(FALLBACK_CYCLE)
    return FALLBACK_CYCLE[idx], FALLBACK_CATEGORY_NAMES[idx], True


def draw_category(img, draw, box, category, seed, fallback_index, progress=1.0, accent=S.ACCENT):
    fn, _, _ = resolve_diagram(category, fallback_index)
    fn(img, draw, box, seed=seed, progress=progress, accent=accent)
