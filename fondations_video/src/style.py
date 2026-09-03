"""Système de style 'plan technique / blueprint' (fond blanc, accent bordeaux)."""
import math
import random
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
MARGIN = 88

BG = (255, 255, 255)
INK = (26, 26, 26)
GRAY = (150, 150, 150)
GRAY_LIGHT = (225, 225, 225)
FILL_LIGHT = (235, 235, 235)
ACCENT = (139, 30, 42)
ACCENT_FILL = (250, 225, 227)

FONT_DIR = "/usr/share/fonts/truetype/dejavu/"


def font(path, size):
    return ImageFont.truetype(FONT_DIR + path, size)


def F_MONO(s=26):
    return font("DejaVuSansMono.ttf", s)


def F_MONO_B(s=26):
    return font("DejaVuSansMono-Bold.ttf", s)


def F_TITLE(s=58):
    return font("DejaVuSans-Bold.ttf", s)


def F_NUM(s=54):
    return font("DejaVuSansMono-Bold.ttf", s)


def new_frame():
    return Image.new("RGB", (W, H), BG)


def wrap_text(draw, text, fnt, max_width):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=fnt) <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def header(draw, number, title, subtitle=None):
    draw.text((MARGIN, 150), f"{number:02d}", font=F_NUM(50), fill=ACCENT)
    if subtitle:
        tw = draw.textlength(subtitle, font=F_MONO(28))
        draw.text((W - MARGIN - tw, 160), subtitle, font=F_MONO(28), fill=GRAY)
    draw.text((MARGIN, 215), title.upper(), font=F_TITLE(54), fill=INK)
    line_y = 300
    draw.line([(MARGIN, line_y), (W - MARGIN, line_y)], fill=INK, width=4)
    return line_y


def footer(draw, caption, tag="GÉNIE CIVIL", page=1, total=8):
    max_w = W - 2 * MARGIN - 40
    fnt = F_MONO_B(30)
    all_lines = wrap_text(draw, caption, fnt, max_w)
    lines = all_lines[:5]
    if len(all_lines) > 5:
        lines[-1] = lines[-1].rstrip() + " …"
    line_h = 42
    y = H - 210 - len(lines) * line_h
    draw.rectangle([MARGIN, y + 6, MARGIN + 18, y + 24], fill=ACCENT)
    for line in lines:
        draw.text((MARGIN + 40, y), line, font=fnt, fill=INK)
        y += line_h

    bar_y = H - 130
    draw.line([(MARGIN, bar_y), (W - MARGIN, bar_y)], fill=GRAY_LIGHT, width=4)
    frac = max(0.0, min(1.0, page / total))
    fill_w = (W - 2 * MARGIN) * frac
    if fill_w > 0:
        draw.line([(MARGIN, bar_y), (MARGIN + fill_w, bar_y)], fill=ACCENT, width=4)

    draw.text((MARGIN, H - 95), tag, font=F_MONO(24), fill=GRAY)
    pg = f"{page}/{total}"
    tw = draw.textlength(pg, font=F_MONO(24))
    draw.text((W - MARGIN - tw, H - 95), pg, font=F_MONO(24), fill=GRAY)


def hatch_rect(img, box, spacing=16, color=INK, width=2, outline=True):
    """Hachures diagonales 45° à l'intérieur de box, sur l'image PIL `img`."""
    x1, y1, x2, y2 = [int(v) for v in box]
    bw, bh = max(x2 - x1, 1), max(y2 - y1, 1)
    tile = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
    td = ImageDraw.Draw(tile)
    for x in range(-bh, bw + bh, spacing):
        td.line([(x, 0), (x + bh, bh)], fill=color, width=width)
    img.paste(tile, (x1, y1), tile)
    d = ImageDraw.Draw(img)
    if outline:
        d.rectangle(box, outline=color, width=2)


def stipple(draw, box, n=260, color=(140, 140, 140)):
    x1, y1, x2, y2 = box
    rnd = random.Random(int(x1 + y1 + x2 + y2))
    for _ in range(n):
        x = rnd.uniform(x1, x2)
        y = rnd.uniform(y1, y2)
        r = rnd.uniform(1.2, 3.2)
        draw.ellipse([x - r, y - r, x + r, y + r], fill=color)


def concrete_band(draw, box, edge_color=ACCENT):
    x1, y1, x2, y2 = box
    draw.rectangle(box, outline=INK, width=2, fill=FILL_LIGHT)
    stipple(draw, box, n=int((x2 - x1) * (y2 - y1) / 90))
    draw.line([(x1, y1), (x2, y1)], fill=edge_color, width=5)
    draw.line([(x1, y2), (x2, y2)], fill=edge_color, width=5)


def dashed_line(draw, x1, y1, x2, y2, color=GRAY, width=2, dash=10, gap=8):
    length = math.hypot(x2 - x1, y2 - y1)
    if length == 0:
        return
    dx, dy = (x2 - x1) / length, (y2 - y1) / length
    dist = 0
    while dist < length:
        seg_end = min(dist + dash, length)
        draw.line([(x1 + dx * dist, y1 + dy * dist), (x1 + dx * seg_end, y1 + dy * seg_end)], fill=color, width=width)
        dist += dash + gap


def dim_line(draw, x1, y1, x2, y2, label, fnt=None, color=INK, offset=0):
    fnt = fnt or F_MONO_B(26)
    draw.line([(x1, y1), (x2, y2)], fill=color, width=2)
    for (x, y) in ((x1, y1), (x2, y2)):
        ang = math.atan2(y2 - y1, x2 - x1) + math.pi / 2
        draw.line([(x - 8 * math.cos(ang), y - 8 * math.sin(ang)),
                   (x + 8 * math.cos(ang), y + 8 * math.sin(ang))], fill=color, width=2)
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    tw = draw.textlength(label, font=fnt)
    if abs(x2 - x1) >= abs(y2 - y1):
        draw.rectangle([mx - tw / 2 - 6, my - 18, mx + tw / 2 + 6, my + 18], fill=BG)
        draw.text((mx - tw / 2, my - 14), label, font=fnt, fill=color)
    else:
        draw.rectangle([mx - tw / 2 - 6, my - 16, mx + tw / 2 + 6, my + 16], fill=BG)
        draw.text((mx - tw / 2, my - 13), label, font=fnt, fill=color)


def leader(draw, x1, y1, xk, yk, x2, y2, label, fnt=None, color=ACCENT):
    fnt = fnt or F_MONO_B(26)
    draw.line([(x1, y1), (xk, yk)], fill=color, width=2)
    draw.line([(xk, yk), (x2, y2)], fill=color, width=2)
    r = 4
    draw.ellipse([x1 - r, y1 - r, x1 + r, y1 + r], fill=color)
    ty = y2 - 12 if y2 <= yk else y2 - 6
    align = "left" if x2 >= xk else "right"
    tw = draw.textlength(label, font=fnt)
    tx = x2 + 10 if align == "left" else x2 - 10 - tw
    tx = max(MARGIN - 40, min(tx, W - MARGIN + 40 - tw))
    draw.text((tx, ty), label, font=fnt, fill=color)


def arrow(draw, x1, y1, x2, y2, color=ACCENT, width=5, head=14):
    draw.line([(x1, y1), (x2, y2)], fill=color, width=width)
    ang = math.atan2(y2 - y1, x2 - x1)
    for da in (-0.5, 0.5):
        a = ang + math.pi - da
        px, py = x2 + head * math.cos(a), y2 + head * math.sin(a)
        draw.line([(x2, y2), (px, py)], fill=color, width=width)
