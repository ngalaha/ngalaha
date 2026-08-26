"""Shared beam/wall diagram builder for both mechanics clips of the
balcon-porte-a-faux video. Kept in one place so the diagram looks
identical in clip 1 and clip 2 (same geometry, same numbers).

Canvas: portrait 1080x1920 -> frame_width ~= 4.5, frame_height = 8
(Manim units). Content is kept in the upper ~70% of the frame; the
bottom is left empty on purpose so Remotion can overlay a caption
scrim there without covering anything important.
"""

from manim import *
import numpy as np

# Manim does NOT auto-recompute frame_width from a custom -r pixel size —
# it stays at the 16:9 default (14.22) unless set explicitly, which made
# every diagram render tiny in the middle of the portrait canvas. Force it
# to match our 1080x1920 target so unit-based coordinates below map to the
# full frame width.
config.frame_width = 4.5

# --- The one numeric case used throughout the video ---
L = 2.0          # m, portee du balcon
W_LOAD = 4.0     # kN/m, charge repartie
P_LOAD = 6.0     # kN, charge ponctuelle du poteau
D_POST = 1.4     # m, distance poteau -> encastrement
W_RESULT = 8.0   # kN, resultante de la charge repartie (w * L)
R_REACTION = 14.0    # kN, reaction verticale (W + P)
M_REPARTIE = 8.0     # kN.m, W * (L/2)
M_POTEAU = 8.4       # kN.m, P * d
M_TOTAL = 16.4       # kN.m

NAVY_DARK = "#0A1526"
WHITE_C = "#F8FAFC"
MIST = "#A9C0DC"
AMBER = "#FBBF24"
GREEN = "#34D399"
RED = "#F87171"

BEAM_LEN = 3.2   # Manim units, drawn length of the beam
BEAM_Y = 2.2     # vertical position of the beam line
WALL_X = -1.9    # x of the wall's inner face (beam start)


def diagram_label(text, size=30, color=WHITE_C, weight=NORMAL):
    return Text(text, font_size=size, color=color, weight=weight)


def build_wall(height=2.4):
    """Hatched wall block, its right face at WALL_X."""
    block = Rectangle(width=0.5, height=height, color=MIST, fill_color="#173257", fill_opacity=1)
    block.move_to(np.array([WALL_X - 0.25, BEAM_Y, 0]))
    hatches = VGroup(
        *[
            Line(
                np.array([WALL_X - 0.5, BEAM_Y - height / 2 + 0.25 * i, 0]),
                np.array([WALL_X - 0.5 + 0.22, BEAM_Y - height / 2 + 0.25 * i - 0.22, 0]),
                color=MIST,
                stroke_width=2,
            )
            for i in range(int(height / 0.25) + 1)
        ]
    )
    return VGroup(block, hatches)


def build_beam():
    return Line(
        np.array([WALL_X, BEAM_Y, 0]),
        np.array([WALL_X + BEAM_LEN, BEAM_Y, 0]),
        color=WHITE_C,
        stroke_width=10,
    )


def post_x():
    """x position of the point load, proportional to D_POST/L along the beam."""
    return WALL_X + BEAM_LEN * (D_POST / L)


def build_distributed_arrows(n=7):
    xs = np.linspace(WALL_X + 0.15, WALL_X + BEAM_LEN - 0.1, n)
    arrows = VGroup(
        *[
            Arrow(
                np.array([x, BEAM_Y + 0.55, 0]),
                np.array([x, BEAM_Y + 0.08, 0]),
                color=MIST,
                buff=0,
                stroke_width=3,
                max_tip_length_to_length_ratio=0.35,
            )
            for x in xs
        ]
    )
    return arrows


def build_point_load_arrow():
    x = post_x()
    return Arrow(
        np.array([x, BEAM_Y + 0.95, 0]),
        np.array([x, BEAM_Y + 0.08, 0]),
        color=AMBER,
        buff=0,
        stroke_width=7,
        max_tip_length_to_length_ratio=0.22,
    )


def _dim_row(x_start, x_end, y, text, color, size=22):
    line = Line(np.array([x_start, y, 0]), np.array([x_end, y, 0]), color=color, stroke_width=2)
    tick_a = Line(np.array([x_start, y - 0.06, 0]), np.array([x_start, y + 0.06, 0]), color=color, stroke_width=2)
    tick_b = Line(np.array([x_end, y - 0.06, 0]), np.array([x_end, y + 0.06, 0]), color=color, stroke_width=2)
    label = diagram_label(text, size=size, color=color).next_to(line, DOWN, buff=0.1)
    return VGroup(line, tick_a, tick_b, label)


def build_dimension_lines():
    """Two stacked rows: L (full span) above, d (post distance) below —
    kept on separate rows so the two labels never overlap."""
    row_l = _dim_row(WALL_X, WALL_X + BEAM_LEN, BEAM_Y - 0.65, "L = 2,0 m", MIST)
    row_d = _dim_row(WALL_X, post_x(), BEAM_Y - 1.35, "1,4 m", AMBER, size=20)
    return VGroup(row_l, row_d)


def build_full_diagram():
    """Wall + beam + distributed load + point load, no reaction arrows yet.
    Returns a VGroup of exactly 7 children in this order:
    wall, beam, w_arrows, p_arrow, dim (both dimension rows), p_label, w_label.
    """
    wall = build_wall()
    beam = build_beam()
    w_arrows = build_distributed_arrows()
    p_arrow = build_point_load_arrow()
    dim = build_dimension_lines()

    # P sits at 70% along the beam. Its arrow is tall (tail at BEAM_Y+0.95)
    # and its label (measured width ~1.39) is wide, while w_label (measured
    # width ~1.83) is wide too — the two combined are wider than the gap
    # between the wall and P's arrow, so no purely horizontal placement of
    # both labels at the same height can avoid overlap. Fix: keep w_label
    # low (next to its own shorter arrows) but shift it left so its own
    # span never reaches P's arrow x — and put p_label distinctly higher,
    # in its own vertical band above w_label entirely, rather than in the
    # same row.
    p_label = diagram_label("P = 6 kN", size=22, color=AMBER).next_to(p_arrow, UP, buff=0.18)
    w_label = diagram_label("w = 4 kN/m", size=22, color=MIST).next_to(w_arrows, UP, buff=0.12)
    w_label.set_x(WALL_X + 1.15)

    group = VGroup(wall, beam, w_arrows, p_arrow, dim, p_label, w_label)
    group.move_to(np.array([0, 1.5, 0]))
    return group
