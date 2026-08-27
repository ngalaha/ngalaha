"""Shared constants and drawing helpers for the erreur-fondation Manim
scene: a real technical cross-section (coupe) of a strip footing
(semelle filante), not a simplified illustration.

Canvas: portrait 1080x1920 -> frame_width ~= 4.5, frame_height = 8
(Manim units). White background, "Génie Civil" brand palette.
"""

from manim import *
import numpy as np

# Manim does NOT auto-recompute frame_width from a custom -r pixel size —
# it stays at the 16:9 default unless set explicitly (same fix as the
# balcon-porte-a-faux project).
config.frame_width = 4.5

# --- The numeric case used throughout this video ---
DEPTH_ERROR = 0.60     # m, profondeur hors-gel (creusée, insuffisante ici)
DEPTH_REQUIRED = 1.20  # m, profondeur minimale requise (argile, aléa fort)
FOOTING_WIDTH = 0.50   # m
FOOTING_HEIGHT = 0.25  # m
CLEAN_CONCRETE = 0.05  # m, béton de propreté
COVER = 0.03           # m, enrobage des armatures

INK = "#12141a"
GRAY = "#6b7280"
RED = "#e11d3c"
ORANGE = "#f5820a"
BLUE = "#1d5fd6"
GREEN = "#189652"
WHITE_BG = "#ffffff"

SCALE = 1.6  # 1 metre = 1.6 Manim units
GROUND_Y = 2.55


def fr(x):
    """1.2 -> "1,20"; 0.6 -> "0,60" (French decimal, 2 places for metres)."""
    return f"{x:.2f}".replace(".", ",")


def diagram_label(text, size=28, color=INK, weight=NORMAL, font="monospace"):
    return Text(text, font_size=size, color=color, weight=weight, font=font)


def build_ground_and_soil(half_width=1.6, depth=2.3):
    """Ground line + hatched clay-soil fill below it."""
    ground_line = Line(
        np.array([-half_width, GROUND_Y, 0]), np.array([half_width, GROUND_Y, 0]),
        color=INK, stroke_width=5,
    )
    hatches = VGroup(
        *[
            Line(
                np.array([x, GROUND_Y, 0]),
                np.array([x - 0.16, GROUND_Y - depth, 0]),
                color=GRAY, stroke_width=1.5,
            )
            for x in np.arange(-half_width + 0.1, half_width, 0.22)
        ]
    )
    return VGroup(ground_line, hatches)


def build_dim_v(x, y_top, y_bottom, label, color=INK, size=22, label_side=RIGHT):
    """Vertical dimension line with end ticks and a side label."""
    line = Line(np.array([x, y_top, 0]), np.array([x, y_bottom, 0]), color=color, stroke_width=2)
    tick_a = Line(np.array([x - 0.06, y_top, 0]), np.array([x + 0.06, y_top, 0]), color=color, stroke_width=2)
    tick_b = Line(np.array([x - 0.06, y_bottom, 0]), np.array([x + 0.06, y_bottom, 0]), color=color, stroke_width=2)
    text = diagram_label(label, size=size, color=color)
    text.next_to(line, label_side, buff=0.12)
    return VGroup(line, tick_a, tick_b, text)


def build_dim_h(x_left, x_right, y, label, color=INK, size=22, label_side=DOWN):
    line = Line(np.array([x_left, y, 0]), np.array([x_right, y, 0]), color=color, stroke_width=2)
    tick_a = Line(np.array([x_left, y - 0.06, 0]), np.array([x_left, y + 0.06, 0]), color=color, stroke_width=2)
    tick_b = Line(np.array([x_right, y - 0.06, 0]), np.array([x_right, y + 0.06, 0]), color=color, stroke_width=2)
    text = diagram_label(label, size=size, color=color)
    text.next_to(line, label_side, buff=0.1)
    return VGroup(line, tick_a, tick_b, text)


def build_cartouche():
    """Bottom title block, same convention as the '8 types de plans' cards:
    red rule, then three stacked left-aligned rows (title / scale / brand).
    Measured at these sizes each row's own text width stays well under the
    4.5-unit frame width — the full "PLAN DE FONDATION — COUPE TYPE — éch.
    1/50 — GÉNIE CIVIL" as one or two rows measured wider than the frame
    itself and clipped off-screen regardless of alignment, hence 3 rows."""
    rule = Line(np.array([-1.85, -2.85, 0]), np.array([1.85, -2.85, 0]), color=RED, stroke_width=4)
    title = diagram_label("PLAN DE FONDATION", size=19, color=INK, weight=BOLD)
    title.next_to(rule, DOWN, buff=0.14).align_to(rule, LEFT)
    scale_txt = diagram_label("éch. 1/50 · coupe type", size=16, color=GRAY)
    scale_txt.next_to(title, DOWN, buff=0.12).align_to(rule, LEFT)
    brand = diagram_label("GÉNIE CIVIL", size=15, color=GRAY)
    brand.next_to(scale_txt, DOWN, buff=0.1).align_to(rule, LEFT)
    return VGroup(rule, title, scale_txt, brand)
