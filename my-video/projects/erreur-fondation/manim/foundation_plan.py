"""FoundationPlan (~22.1s): a real technical cross-section of a strip
footing (semelle filante) on clay soil at the required 1,20 m depth —
not a simplified illustration. White background, "Génie Civil" palette.
Remotion overlays the narration captions on top of this clip.

Phase C zooms into a separate, larger-scale detail of the footing itself
(a standard professional convention: an overview coupe at 1/50 plus a
zoomed "détail semelle" at 1/20 for the rebar/enrobage annotations that
would be illegibly cramped at the overview scale).
"""

from manim import *
import numpy as np
from diagram_helpers import (
    INK, GRAY, RED, ORANGE, BLUE, GREEN, WHITE_BG,
    GROUND_Y, SCALE, FOOTING_WIDTH, FOOTING_HEIGHT, CLEAN_CONCRETE, COVER,
    fr, diagram_label, build_ground_and_soil, build_dim_v, build_dim_h, build_cartouche,
)


class FoundationPlan(Scene):
    def construct(self):
        self.camera.background_color = WHITE_BG

        footing_bottom = GROUND_Y - 1.20 * SCALE  # ancrage depth = 1,20 m
        footing_top = footing_bottom + FOOTING_HEIGHT * SCALE
        bp_bottom = footing_bottom - CLEAN_CONCRETE * SCALE
        half_w = (FOOTING_WIDTH * SCALE) / 2  # footing half-width

        # --- Phase A: ground, clay soil, depth cotation (~6.0s) ---
        ground = build_ground_and_soil()
        argile_label = diagram_label("ARGILE", size=24, color=ORANGE, weight=BOLD)
        argile_label.move_to(np.array([-1.15, 1.5, 0]))

        depth_dim = build_dim_v(1.3, GROUND_Y, footing_bottom, f"{fr(1.20)} m", color=RED, size=22)

        self.play(Create(ground[0]), run_time=0.6)
        self.play(LaggedStart(*[Create(h) for h in ground[1]], lag_ratio=0.05), run_time=0.8)
        self.play(FadeIn(argile_label), run_time=0.6)
        self.play(Create(depth_dim), run_time=0.9)
        self.wait(3.1)

        # --- Phase B: the footing itself + width/height cotations (~6.0s) ---
        footing = Rectangle(
            width=FOOTING_WIDTH * SCALE, height=FOOTING_HEIGHT * SCALE,
            color=INK, fill_color=BLUE, fill_opacity=0.12, stroke_width=3,
        )
        footing.move_to(np.array([0, (footing_top + footing_bottom) / 2, 0]))

        width_dim = build_dim_h(-half_w, half_w, footing_bottom - 0.3, "50 cm", color=GRAY, size=20)
        height_dim = build_dim_v(half_w + 0.25, footing_top, footing_bottom, "25 cm", color=GRAY, size=18)

        self.play(FadeIn(footing), run_time=0.8)
        self.play(Create(width_dim), run_time=0.7)
        self.play(Create(height_dim), run_time=0.7)
        self.wait(3.8)

        # --- Phase C: zoom into a larger detail view of the footing to
        # annotate béton de propreté, armatures and enrobage with room to
        # spare (~7.5s) ---
        overview = VGroup(ground, argile_label, depth_dim, footing, width_dim, height_dim)
        self.play(
            overview.animate.scale(0.45).to_corner(UP + LEFT, buff=0.3),
            run_time=0.9,
        )

        detail_label = diagram_label("DÉTAIL SEMELLE — éch. 1/20", size=20, color=INK, weight=BOLD)
        detail_label.move_to(np.array([0, 1.95, 0]))

        # Rebuild the footing at 2.5x scale, centered, with room around it.
        z = 2.5
        f_w, f_h = FOOTING_WIDTH * SCALE * z, FOOTING_HEIGHT * SCALE * z
        f_top, f_bottom = 0.75, 0.75 - f_h
        footing_detail = Rectangle(
            width=f_w, height=f_h, color=INK, fill_color=BLUE, fill_opacity=0.12, stroke_width=3,
        ).move_to(np.array([0, (f_top + f_bottom) / 2, 0]))

        bp_h = CLEAN_CONCRETE * SCALE * z
        clean_concrete = Rectangle(
            width=f_w, height=bp_h, color=GRAY, fill_color=GRAY, fill_opacity=0.35, stroke_width=1.5,
        ).move_to(np.array([0, f_bottom - bp_h / 2, 0]))
        bp_label = diagram_label("béton de propreté (5 cm)", size=17, color=GRAY)
        bp_label.next_to(clean_concrete, DOWN, buff=0.2)

        rebar_y = f_bottom + 0.22
        rebar_xs = np.linspace(-f_w / 2 + 0.22, f_w / 2 - 0.22, 4)
        rebars = VGroup(
            *[Circle(radius=0.07, color=INK, fill_color=INK, fill_opacity=1).move_to(np.array([x, rebar_y, 0])) for x in rebar_xs]
        )
        # Fixed safe-margin positions (not next_to a wide group) so labels
        # never reach past the frame edge regardless of the group's width.
        rebar_label = diagram_label("4 HA10", size=20, color=INK)
        rebar_label.move_to(np.array([-1.6, 0.35, 0]))
        rebar_arrow = Arrow(rebar_label.get_bottom(), rebars[0].get_top(), color=INK, stroke_width=2, buff=0.12)

        cadre = Rectangle(width=f_w - 0.22, height=f_h - 0.22, color=GREEN, stroke_width=2.5)
        cadre.move_to(footing_detail.get_center())
        cadre_label = diagram_label("cadres HA8", size=17, color=GREEN)
        cadre_label.move_to(np.array([1.1, 0.5, 0]))
        cadre_arrow = Arrow(
            cadre_label.get_corner(DOWN + LEFT), cadre.get_corner(UP + RIGHT),
            color=GREEN, stroke_width=2, buff=0.12,
        )

        enrobage_dim = build_dim_h(
            -f_w / 2, -f_w / 2 + COVER * SCALE * z, f_top + 0.3, "enrobage 3 cm", color=ORANGE, size=17, label_side=UP,
        )

        self.play(FadeIn(detail_label), FadeIn(footing_detail), run_time=0.7)
        self.play(FadeIn(clean_concrete), FadeIn(bp_label), run_time=0.6)
        self.play(
            LaggedStart(*[FadeIn(r) for r in rebars], lag_ratio=0.15),
            FadeIn(rebar_label), GrowArrow(rebar_arrow),
            run_time=0.8,
        )
        self.play(Create(cadre), FadeIn(cadre_label), GrowArrow(cadre_arrow), run_time=0.7)
        self.play(Create(enrobage_dim), run_time=0.6)
        self.wait(3.5)

        # --- Phase D: cartouche (~2.6s) ---
        cartouche = build_cartouche()
        self.play(FadeIn(cartouche, shift=UP * 0.1), run_time=0.9)
        self.wait(1.7)
