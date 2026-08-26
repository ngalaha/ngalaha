"""Clip 2 (~24s): generic lever-arm demo (M = F x d) -> full numeric
calculation for this exact balcony. No narrative text — Remotion overlays
captions on top of this clip.
"""

from manim import *
import numpy as np
from diagram_helpers import (
    NAVY_DARK, WHITE_C, MIST, AMBER, GREEN,
    diagram_label, build_full_diagram, D_POST, L, W_LOAD, P_LOAD,
    W_RESULT, M_REPARTIE, M_POTEAU, M_TOTAL, R_REACTION,
)


def fr(x):
    """1.4 -> "1,4"; 8.0 -> "8" (French decimal, no trailing .0)."""
    s = f"{x:g}"
    return s.replace(".", ",")


class Mechanics2(Scene):
    def construct(self):
        self.camera.background_color = NAVY_DARK

        # --- Phase 1: generic lever-arm demo (~12s) ---
        pivot = Dot(np.array([-1.6, 1.6, 0]), color=MIST, radius=0.09)
        pivot_tri = Triangle(color=MIST).scale(0.18).next_to(pivot, DOWN, buff=0).shift(UP * 0.1)
        arm = Line(np.array([-1.6, 1.6, 0]), np.array([1.6, 1.6, 0]), color=WHITE_C, stroke_width=8)

        d_tracker = ValueTracker(1.0)

        def force_x():
            return -1.6 + d_tracker.get_value()

        force_arrow = always_redraw(
            lambda: Arrow(
                np.array([force_x(), 2.5, 0]), np.array([force_x(), 1.72, 0]),
                color=AMBER, buff=0, stroke_width=7, max_tip_length_to_length_ratio=0.25,
            )
        )
        f_label = always_redraw(lambda: diagram_label("F", size=26, color=AMBER).next_to(force_arrow, UP, buff=0.08))

        brace_line = always_redraw(
            lambda: Line(np.array([-1.6, 1.15, 0]), np.array([force_x(), 1.15, 0]), color=MIST, stroke_width=2)
        )
        d_label = always_redraw(
            lambda: diagram_label("d", size=24, color=MIST).next_to(brace_line, DOWN, buff=0.1)
        )

        formula = diagram_label("M = F × d", size=40, color=WHITE_C, weight=BOLD)
        formula.move_to(np.array([0, 0.1, 0]))

        # Plain Text recomputed every frame instead of DecimalNumber: Manim's
        # DecimalNumber renders through LaTeX, which is not installed here.
        m_group = always_redraw(
            lambda: diagram_label(f"M = {5.0 * d_tracker.get_value():.0f}", size=32, color=GREEN).move_to(
                np.array([0, -0.9, 0])
            )
        )

        self.play(Create(arm), FadeIn(pivot), FadeIn(pivot_tri), run_time=0.7)
        self.play(GrowArrow(force_arrow), FadeIn(f_label), Create(brace_line), FadeIn(d_label), run_time=0.7)
        self.play(Write(formula), run_time=0.9)
        self.play(FadeIn(m_group), run_time=0.5)
        self.wait(0.8)

        self.play(d_tracker.animate.set_value(3.0), run_time=2.6, rate_func=smooth)
        self.wait(0.5)
        note = diagram_label("Plus d grandit,\nplus M grandit", size=26, color=MIST)
        note.next_to(m_group, DOWN, buff=0.45)
        self.play(FadeIn(note, shift=UP * 0.15), run_time=0.7)
        self.wait(2.0)

        m_group.clear_updaters()
        self.play(
            FadeOut(arm), FadeOut(pivot), FadeOut(pivot_tri), FadeOut(force_arrow), FadeOut(f_label),
            FadeOut(brace_line), FadeOut(d_label), FadeOut(formula), FadeOut(m_group), FadeOut(note),
            run_time=0.7,
        )

        # --- Phase 2: full numeric calculation (~12s) ---
        diagram = build_full_diagram()
        diagram.scale(0.75).to_edge(UP, buff=0.55)
        self.play(FadeIn(diagram), run_time=0.9)

        # Frame is only 4.5 units wide (portrait) — every formula is split
        # onto two shorter lines so it fits without clipping the edges.
        line1 = diagram_label(
            f"W = w × L\n= {fr(W_LOAD)} × {fr(L)} = {fr(W_RESULT)} kN", size=24, color=MIST
        )
        line1.next_to(diagram, DOWN, buff=0.5)
        self.play(FadeIn(line1, shift=UP * 0.15), run_time=0.7)
        self.wait(1.2)

        line2 = diagram_label(
            f"M répartie = W × {fr(L / 2)}\n= {fr(M_REPARTIE)} kN·m", size=24, color=MIST
        )
        line2.next_to(line1, DOWN, buff=0.3)
        self.play(FadeIn(line2, shift=UP * 0.15), run_time=0.7)
        self.wait(1.3)

        line3 = diagram_label(
            f"M poteau = P × d\n= {fr(P_LOAD)} × {fr(D_POST)} = {fr(M_POTEAU)} kN·m", size=24, color=AMBER
        )
        line3.next_to(line2, DOWN, buff=0.3)
        self.play(FadeIn(line3, shift=UP * 0.15), run_time=0.7)
        self.wait(1.3)

        total_box_text = diagram_label(
            f"M total = {fr(M_REPARTIE)} + {fr(M_POTEAU)}\n= {fr(M_TOTAL)} kN·m", size=27, color=GREEN, weight=BOLD
        )
        total_box_text.next_to(line3, DOWN, buff=0.45)
        total_box = SurroundingRectangle(total_box_text, color=GREEN, buff=0.18, stroke_width=3)
        self.play(FadeIn(total_box_text, shift=UP * 0.15), Create(total_box), run_time=0.9)
        self.wait(1.6)

        # Fade the earlier lines out completely before sliding the total
        # into their place — doing both at once briefly overlapped the
        # still-fading "M poteau" line with the incoming "M total" box.
        self.play(FadeOut(line1), FadeOut(line2), FadeOut(line3), run_time=0.5)
        self.play(
            VGroup(total_box_text, total_box).animate.move_to(np.array([0, -1.2, 0])),
            run_time=0.6,
        )

        r_badge_text = diagram_label(f"R = {fr(R_REACTION)} kN", size=28, color=GREEN, weight=BOLD)
        r_badge = VGroup(r_badge_text)
        r_badge.next_to(VGroup(total_box_text, total_box), DOWN, buff=0.5)
        self.play(FadeIn(r_badge, shift=UP * 0.15), run_time=0.8)
        self.wait(1.9)
