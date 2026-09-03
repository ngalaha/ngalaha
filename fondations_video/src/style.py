"""Système de style 'plan technique / blueprint' (fond blanc, accent bordeaux)."""
import math
import os
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

# Polices embarquées dans le projet (src/fonts/) plutôt que dépendre des
# polices système : leur chemin varie trop d'un OS à l'autre (Linux classique
# vs Termux/Android, qui n'a pas de /usr) pour être fiable.
FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts") + os.sep


def font(path, size):
    try:
        return ImageFont.truetype(FONT_DIR + path, size)
    except OSError:
        # Filet de sécurité : la police embarquée est introuvable pour une
        # raison quelconque — mieux vaut un rendu dégradé qu'un plantage.
        try:
            return ImageFont.load_default(size=size)
        except TypeError:
            return ImageFont.load_default()


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


def header(draw, number, title, subtitle=None, title_progress=1.0, accent=ACCENT):
    """title_progress < 1.0 révèle le titre lettre par lettre (effet machine
    à écrire). `accent` teinte le numéro de planche (couleur par catégorie)."""
    draw.text((MARGIN, 150), f"{number:02d}", font=F_NUM(50), fill=accent)
    if subtitle:
        tw = draw.textlength(subtitle, font=F_MONO(28))
        draw.text((W - MARGIN - tw, 160), subtitle, font=F_MONO(28), fill=GRAY)
    full_title = title.upper()
    n = len(full_title) if title_progress >= 1.0 else round(len(full_title) * max(0.0, title_progress))
    shown_title = full_title[:n]
    draw.text((MARGIN, 215), shown_title, font=F_TITLE(54), fill=INK)
    line_y = 300
    draw.line([(MARGIN, line_y), (W - MARGIN, line_y)], fill=INK, width=4)
    return line_y


def wrap_caption(draw, caption):
    """Découpe une légende en lignes affichables (identique à footer())."""
    max_w = W - 2 * MARGIN - 40
    fnt = F_MONO_B(30)
    all_lines = wrap_text(draw, caption, fnt, max_w)
    lines = all_lines[:5]
    if len(all_lines) > 5:
        lines[-1] = lines[-1].rstrip() + " …"
    return lines


def wrap_caption_with_starts(draw, words):
    """Comme wrap_caption(), mais retourne une liste de (ligne, t_debut) où
    t_debut est le timestamp (dans le référentiel de `words`) du premier mot
    de cette ligne — pour révéler chaque ligne de légende exactement quand
    elle est prononcée."""
    max_w = W - 2 * MARGIN - 40
    fnt = F_MONO_B(30)
    lines = []
    cur_text = ""
    line_start = None
    for w in words:
        token = w["word"].strip()
        if not token:
            continue
        trial = (cur_text + " " + token).strip()
        if draw.textlength(trial, font=fnt) <= max_w:
            cur_text = trial
            if line_start is None:
                line_start = w["start"]
        else:
            if cur_text:
                lines.append((cur_text, line_start))
            cur_text = token
            line_start = w["start"]
    if cur_text:
        lines.append((cur_text, line_start))
    if len(lines) > 5:
        kept = lines[:5]
        kept[-1] = (kept[-1][0].rstrip() + " …", kept[-1][1])
        lines = kept
    return lines


def footer_chrome(draw, tag="GÉNIE CIVIL", page=1, total=8, accent=ACCENT):
    """Barre de progression + tag + pagination : toujours statiques,
    dessinés une fois par frame indépendamment de la légende."""
    bar_y = H - 130
    draw.line([(MARGIN, bar_y), (W - MARGIN, bar_y)], fill=GRAY_LIGHT, width=4)
    frac = max(0.0, min(1.0, page / total))
    fill_w = (W - 2 * MARGIN) * frac
    if fill_w > 0:
        draw.line([(MARGIN, bar_y), (MARGIN + fill_w, bar_y)], fill=accent, width=4)

    draw.text((MARGIN, H - 95), tag, font=F_MONO(24), fill=GRAY)
    pg = f"{page}/{total}"
    tw = draw.textlength(pg, font=F_MONO(24))
    draw.text((W - MARGIN - tw, H - 95), pg, font=F_MONO(24), fill=GRAY)


def footer_caption(draw, lines, lines_shown=None, accent=ACCENT):
    """Dessine les lignes de légende déjà calculées par wrap_caption().
    lines_shown limite le nombre de lignes affichées (révélation
    progressive, ligne par ligne, calée sur la voix off)."""
    if lines_shown is None:
        lines_shown = len(lines)
    visible = lines[:lines_shown]
    if not visible:
        return
    fnt = F_MONO_B(30)
    line_h = 42
    y = H - 210 - len(lines) * line_h
    draw.rectangle([MARGIN, y + 6, MARGIN + 18, y + 24], fill=accent)
    for line in visible:
        draw.text((MARGIN + 40, y), line, font=fnt, fill=INK)
        y += line_h


def footer(draw, caption, tag="GÉNIE CIVIL", page=1, total=8, lines_shown=None, accent=ACCENT):
    """Pied de page complet (compatibilité : légende + barre + tag)."""
    lines = wrap_caption(draw, caption)
    footer_caption(draw, lines, lines_shown, accent)
    footer_chrome(draw, tag, page, total, accent)


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


def truncate_polyline(points, progress):
    """Retourne le préfixe de `points` correspondant à la fraction
    `progress` (0..1) de la longueur totale du tracé — pour animer un trait
    qui se dessine progressivement (fissure, contour...)."""
    if progress >= 1.0 or len(points) < 2:
        return list(points)
    seg_lengths = [math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1])
                   for i in range(len(points) - 1)]
    total = sum(seg_lengths)
    if total == 0:
        return list(points)
    target = max(0.0, progress) * total
    out = [points[0]]
    covered = 0.0
    for i, seg_len in enumerate(seg_lengths):
        if covered + seg_len >= target:
            remaining = target - covered
            t = remaining / seg_len if seg_len > 0 else 0
            x = points[i][0] + (points[i + 1][0] - points[i][0]) * t
            y = points[i][1] + (points[i + 1][1] - points[i][1]) * t
            out.append((x, y))
            return out
        covered += seg_len
        out.append(points[i + 1])
    return out


def ease(t):
    """Ease-out léger : démarre vite, ralentit en fin de tracé."""
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 2


def stage(progress, start, end):
    """Ramène `progress` sur l'intervalle [start,end] à une fraction 0..1
    (0 avant `start`, 1 après `end`) — pour séquencer les étapes d'un
    diagramme animé."""
    if end <= start:
        return 1.0 if progress >= start else 0.0
    return max(0.0, min(1.0, (progress - start) / (end - start)))


def arrow(draw, x1, y1, x2, y2, color=ACCENT, width=5, head=14):
    draw.line([(x1, y1), (x2, y2)], fill=color, width=width)
    ang = math.atan2(y2 - y1, x2 - x1)
    for da in (-0.5, 0.5):
        a = ang + math.pi - da
        px, py = x2 + head * math.cos(a), y2 + head * math.sin(a)
        draw.line([(x2, y2), (px, py)], fill=color, width=width)
