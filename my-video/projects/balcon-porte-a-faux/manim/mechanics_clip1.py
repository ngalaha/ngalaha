"""Clip 1 (~24s): recap diagram -> encastrement label -> simple support vs
encastrement comparison -> reactions R and M. No narrative text: captions
are added by Remotion on top of this clip (bottom scrim). Only diagram
labels/values belong here.
"""

from manim import *
import numpy as np
from diagram_helpers import (
    NAVY_DARK, WHITE_C, MIST, AMBER, GREEN, RED,
    diagram_label, build_full_diagram, WALL_X, BEAM_Y, BEAM_LEN,
    W_RESULT, P_LOAD, R_REACTION,
)


def fr(x):
    """1.4 -> "1,4"; 8.0 -> "8" (French decimal, no trailing .0)."""
    s = f"{x:g}"
    return s.replace(".", ",")


class Mechanics1(Scene):
    def construct(self):
        self.camera.background_color = NAVY_DARK

        # --- Phase 1: recap draw (~4s) ---
        diagram = build_full_diagram()
        wall, beam, w_arrows, p_arrow, dim, p_label, w_label = diagram

        self.play(Create(wall), run_time=0.6)
        self.play(Create(beam), run_time=0.6)
        self.play(LaggedStart(*[GrowArrow(a) for a in w_arrows], lag_ratio=0.12), FadeIn(w_label), run_time=1.0)
        self.play(GrowArrow(p_arrow), FadeIn(p_label), run_time=0.6)
        self.play(Create(dim), run_time=0.8)
        self.wait(0.4)

        # --- Phase 2: encastrement label (~3s) ---
        wall_glow = SurroundingRectangle(wall, color=AMBER, buff=0.08, stroke_width=4)
        enc_label = diagram_label("ENCASTREMENT", size=26, color=AMBER, weight=BOLD)
        # Centered on the frame's x-axis rather than next_to(wall, ...) —
        # the wall sits near the left edge, and "ENCASTREMENT" at this
        # size is wide enough to clip off-screen if anchored there
        # (only ever caught once this label's hold was long enough to
        # actually screenshot it). An arrow still points back to the wall.
        enc_label.move_to(np.array([0, wall.get_bottom()[1] - 1.1, 0]))
        enc_arrow = Arrow(enc_label.get_top(), wall.get_bottom() + DOWN * 0.1, color=AMBER, stroke_width=3, buff=0.1)

        self.play(Create(wall_glow), run_time=0.6)
        self.play(FadeIn(enc_label), Create(enc_arrow), run_time=0.8)
        # Held well past just naming it — this is the "grand public" beat
        # that explains ENCASTREMENT before any vocabulary appears again.
        self.wait(4.0)
        self.play(FadeOut(wall_glow), FadeOut(enc_label), FadeOut(enc_arrow))

        # --- Phase 3: simple support vs encastrement (~8s) ---
        # Sequential full-width reveal (not side-by-side) — the frame is
        # only 4.5 units wide, too narrow to fit two labeled mini-diagrams
        # side by side without clipping at the edges.
        full_diagram = VGroup(*diagram)
        self.play(full_diagram.animate.scale(0.5).to_corner(UP + LEFT, buff=0.35), run_time=0.8)

        center = np.array([0, 0.3, 0])

        def mini_beam_pin(c):
            pivot = Dot(c + LEFT * 1.5, color=MIST, radius=0.08)
            triangle = Triangle(color=MIST).scale(0.2).next_to(pivot, DOWN, buff=0).shift(UP * 0.1)
            rod = Line(c + LEFT * 1.5, c + RIGHT * 1.5, color=WHITE_C, stroke_width=9)
            load = Arrow(c + RIGHT * 1.5 + UP * 0.6, c + RIGHT * 1.5 + UP * 0.06, color=RED, buff=0, stroke_width=7)
            return VGroup(pivot, triangle, rod, load), rod, load

        def mini_beam_fixed(c):
            wall_block = Rectangle(width=0.3, height=1.1, color=MIST, fill_color="#173257", fill_opacity=1)
            wall_block.move_to(c + LEFT * 1.65)
            rod = Line(c + LEFT * 1.5, c + RIGHT * 1.5, color=WHITE_C, stroke_width=9)
            load = Arrow(c + RIGHT * 1.5 + UP * 0.6, c + RIGHT * 1.5 + UP * 0.06, color=RED, buff=0, stroke_width=7)
            return VGroup(wall_block, rod, load), rod, load

        # -- 3a: simple support fails --
        pin_group, pin_rod, pin_load = mini_beam_pin(center)
        label_pin = diagram_label("Appui simple", size=28, color=MIST).next_to(pin_group, DOWN, buff=0.5)
        self.play(FadeIn(pin_group), FadeIn(label_pin), run_time=0.7)
        self.wait(0.4)

        pivot_point = pin_group[0].get_center()
        fail_mark = Text("✗", font_size=54, color=RED).next_to(pin_group, UP, buff=0.45)
        # The rod swings a long way down when it "falls" — fade the label
        # out first so the rotating rod never crosses through its text.
        self.play(FadeOut(label_pin), run_time=0.3)
        self.play(
            Rotate(VGroup(pin_rod, pin_load), angle=-0.9, about_point=pivot_point),
            FadeIn(fail_mark),
            run_time=1.1,
        )
        self.wait(0.9)
        self.play(FadeOut(pin_group), FadeOut(fail_mark), run_time=0.5)

        # -- 3b: encastrement holds --
        fixed_group, fixed_rod, fixed_load = mini_beam_fixed(center)
        label_fixed = diagram_label("Encastrement", size=28, color=AMBER).next_to(fixed_group, DOWN, buff=0.5)
        self.play(FadeIn(fixed_group), FadeIn(label_fixed), run_time=0.7)
        self.wait(0.4)

        ok_mark = Text("✓", font_size=54, color=GREEN).next_to(fixed_group, UP, buff=0.45)
        self.play(FadeIn(ok_mark), Indicate(fixed_rod, color=AMBER, scale_factor=1.03), run_time=0.9)
        self.wait(1.1)

        self.play(FadeOut(fixed_group), FadeOut(label_fixed), FadeOut(ok_mark))

        # --- Phase 4: reactions R and M (~9s) ---
        self.play(full_diagram.animate.scale(2.0).move_to(np.array([0, 1.5, 0])), run_time=0.8)

        r_arrow = Arrow(
            np.array([WALL_X - 0.9, BEAM_Y - 1.4, 0]),
            np.array([WALL_X - 0.9, BEAM_Y - 0.35, 0]),
            color=GREEN, buff=0, stroke_width=7,
        )
        r_label = diagram_label("R", size=28, color=GREEN, weight=BOLD).next_to(r_arrow, LEFT, buff=0.15)

        m_arc = Arc(radius=0.5, start_angle=PI * 0.15, angle=PI * 1.1, color=GREEN, stroke_width=6)
        m_arc.move_to(np.array([WALL_X - 0.9, BEAM_Y + 0.9, 0]))
        m_arrow_tip = Triangle(color=GREEN, fill_color=GREEN, fill_opacity=1).scale(0.06)
        m_arrow_tip.move_to(m_arc.get_end()).rotate(PI * 0.6)
        m_label = diagram_label("M", size=28, color=GREEN, weight=BOLD).next_to(m_arc, UP, buff=0.1)

        self.play(GrowArrow(r_arrow), FadeIn(r_label), run_time=0.7)
        self.play(Create(m_arc), FadeIn(m_arrow_tip), FadeIn(m_label), run_time=0.9)
        self.wait(0.6)

        r_calc = diagram_label(
            f"R = W + P\n= {fr(W_RESULT)} + {fr(P_LOAD)} = {fr(R_REACTION)} kN", size=24, color=GREEN
        )
        r_calc.next_to(full_diagram, DOWN, buff=0.55)
        self.play(FadeIn(r_calc, shift=UP * 0.15), run_time=0.7)
        # Held longer so "R = 14 kN" fully lands before the moment teaser.
        self.wait(2.6)

        m_teaser = diagram_label("M = ?", size=26, color=AMBER, weight=BOLD)
        m_teaser.next_to(r_calc, DOWN, buff=0.35)
        self.play(FadeIn(m_teaser, shift=UP * 0.15), run_time=0.7)
        # Held well into the crossfade so the question carries into clip 2.
        self.wait(3.9)
