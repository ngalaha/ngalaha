"""Simple animated diagram: a simply-supported beam with a central point load
and its two support reactions. Built with Manim Community Edition, rendered
with the system FFmpeg. Independent of the Remotion project in ../src.
"""

from manim import *
import numpy as np


class BeamReactions(Scene):
    def construct(self):
        self.camera.background_color = WHITE
        Text.set_default(color=BLACK)

        beam_length = 8
        left_x = -beam_length / 2
        right_x = beam_length / 2
        support_size = 0.5

        point_a = np.array([left_x, 0, 0])
        point_b = np.array([right_x, 0, 0])

        # --- Beam ---
        beam = Line(point_a, point_b, color=DARK_GRAY, stroke_width=14)

        # --- Pin support at A (fixed: triangle + hatched ground) ---
        tri_a = Polygon(
            point_a,
            point_a + np.array([-support_size / 2, -support_size, 0]),
            point_a + np.array([support_size / 2, -support_size, 0]),
            color=BLUE_D,
            fill_color=BLUE_D,
            fill_opacity=1,
        )
        ground_a = Line(
            point_a + np.array([-0.55, -support_size, 0]),
            point_a + np.array([0.55, -support_size, 0]),
            color=BLACK,
            stroke_width=4,
        )
        hatch_a = VGroup(
            *[
                Line(
                    ground_a.get_start() + np.array([0.13 * i, 0, 0]),
                    ground_a.get_start() + np.array([0.13 * i - 0.13, -0.18, 0]),
                    color=BLACK,
                    stroke_width=2,
                )
                for i in range(1, 9)
            ]
        )
        support_a = VGroup(tri_a, ground_a, hatch_a)

        # --- Roller support at B (triangle + rollers + hatched ground) ---
        tri_b = Polygon(
            point_b,
            point_b + np.array([-support_size / 2, -support_size * 0.7, 0]),
            point_b + np.array([support_size / 2, -support_size * 0.7, 0]),
            color=BLUE_D,
            fill_color=BLUE_D,
            fill_opacity=1,
        )
        roller_y = -support_size * 0.7 - 0.09
        roller1 = Circle(radius=0.09, color=BLACK, fill_color=GREY_B, fill_opacity=1).move_to(
            point_b + np.array([-support_size / 3, roller_y, 0])
        )
        roller2 = Circle(radius=0.09, color=BLACK, fill_color=GREY_B, fill_opacity=1).move_to(
            point_b + np.array([support_size / 3, roller_y, 0])
        )
        ground_b = Line(
            point_b + np.array([-0.55, roller_y - 0.09, 0]),
            point_b + np.array([0.55, roller_y - 0.09, 0]),
            color=BLACK,
            stroke_width=4,
        )
        hatch_b = VGroup(
            *[
                Line(
                    ground_b.get_start() + np.array([0.13 * i, 0, 0]),
                    ground_b.get_start() + np.array([0.13 * i - 0.13, -0.18, 0]),
                    color=BLACK,
                    stroke_width=2,
                )
                for i in range(1, 9)
            ]
        )
        support_b = VGroup(tri_b, roller1, roller2, ground_b, hatch_b)

        label_a = Text("A", font_size=34).next_to(tri_a, LEFT, buff=0.35)
        label_b = Text("B", font_size=34).next_to(tri_b, RIGHT, buff=0.35)

        # --- Central downward load ---
        load_top = np.array([0, 2.0, 0])
        load_bottom = np.array([0, 0.07, 0])
        load_arrow = Arrow(
            load_top, load_bottom, color=RED, buff=0, stroke_width=8, max_tip_length_to_length_ratio=0.18
        )
        load_label = Text("P", font_size=40, color=RED).next_to(load_top, UP, buff=0.15)

        # --- Support reactions (pointing up into the supports) ---
        ra_start = point_a + np.array([0, -1.6, 0])
        ra_end = point_a + np.array([0, -support_size - 0.05, 0])
        reaction_a = Arrow(
            ra_start, ra_end, color=GREEN_D, buff=0, stroke_width=8, max_tip_length_to_length_ratio=0.28
        )
        reaction_a_label = Text("R_A", font_size=32, color=GREEN_D).next_to(ra_start, DOWN, buff=0.15)

        rb_start = point_b + np.array([0, -1.6, 0])
        rb_end = point_b + np.array([0, roller_y - 0.15, 0])
        reaction_b = Arrow(
            rb_start, rb_end, color=GREEN_D, buff=0, stroke_width=8, max_tip_length_to_length_ratio=0.28
        )
        reaction_b_label = Text("R_B", font_size=32, color=GREEN_D).next_to(rb_start, DOWN, buff=0.15)

        title = Text("Poutre sur deux appuis - charge centrale", font_size=30, color=BLACK)
        title.to_edge(UP, buff=0.5)

        # --- Animation sequence ---
        self.play(Write(title))
        self.play(Create(beam), run_time=1.2)
        self.play(
            FadeIn(support_a, shift=UP * 0.3),
            FadeIn(support_b, shift=UP * 0.3),
            Write(label_a),
            Write(label_b),
            run_time=1.2,
        )
        self.play(GrowArrow(load_arrow), Write(load_label), run_time=1.0)
        self.wait(0.3)
        self.play(
            GrowArrow(reaction_a),
            GrowArrow(reaction_b),
            Write(reaction_a_label),
            Write(reaction_b_label),
            run_time=1.2,
        )
        self.wait(2)
