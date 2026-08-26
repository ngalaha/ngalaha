"""Clip 2 (~34.6s): progressive lever-arm demo (M = F x d) -> full numeric
calculation for this exact balcony, with a highlight beat per value as it
lands (w -> W -> M répartie -> M poteau -> M total -> R). No narrative
text — Remotion overlays captions on top of this clip.
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

        # Three discrete steps instead of one continuous slide: each step
        # is followed by a hold so the growing d -> growing M relationship
        # reads as a deliberate, staged demonstration rather than a single
        # fast animation (or, at the other extreme, one long slow drift).
        self.play(d_tracker.animate.set_value(1.7), run_time=1.0, rate_func=smooth)
        self.wait(1.0)
        self.play(d_tracker.animate.set_value(2.4), run_time=1.0, rate_func=smooth)
        self.wait(1.0)
        self.play(d_tracker.animate.set_value(3.0), run_time=1.0, rate_func=smooth)
        self.wait(1.0)

        note = diagram_label("Plus d grandit,\nplus M grandit", size=26, color=MIST)
        note.next_to(m_group, DOWN, buff=0.45)
        self.play(FadeIn(note, shift=UP * 0.15), run_time=0.7)
        self.wait(3.7)

        m_group.clear_updaters()
        self.play(
            FadeOut(arm), FadeOut(pivot), FadeOut(pivot_tri), FadeOut(force_arrow), FadeOut(f_label),
            FadeOut(brace_line), FadeOut(d_label), FadeOut(formula), FadeOut(m_group), FadeOut(note),
            run_time=0.7,
        )

        # --- Phase 2: full numeric calculation, one highlighted value at a
        # time (~19.9s): w -> W -> M répartie -> M poteau -> M total -> R.
        # Every reveal is followed by an Indicate() pulse so each number
        # is unmistakably "the one being named right now", then the two
        # moment contributions visibly merge into the total.
        diagram = build_full_diagram()
        wall, beam, w_arrows, p_arrow, dim, p_label, w_label = diagram
        diagram.scale(0.55).to_edge(UP, buff=0.4)
        self.play(FadeIn(diagram), run_time=0.9)

        # Beat 1: w = 4 kN/m is already on screen from the recap — highlight
        # it first so "avec les vrais chiffres de ce balcon" has a target.
        self.play(Indicate(w_label, color=AMBER, scale_factor=1.25), run_time=0.8)
        self.wait(1.5)

        # Frame is only 4.5 units wide (portrait) — every formula is split
        # onto two shorter lines so it fits without clipping the edges.
        line1 = diagram_label(
            f"W = w × L\n= {fr(W_LOAD)} × {fr(L)} = {fr(W_RESULT)} kN", size=24, color=MIST
        )
        line1.next_to(diagram, DOWN, buff=0.4)
        self.play(FadeIn(line1, shift=UP * 0.15), run_time=0.7)
        self.play(Indicate(line1, color=AMBER, scale_factor=1.08), run_time=0.7)
        self.wait(1.6)

        line2 = diagram_label(
            f"M répartie = W × {fr(L / 2)}\n= {fr(M_REPARTIE)} kN·m", size=24, color=MIST
        )
        line2.next_to(line1, DOWN, buff=0.22)
        self.play(FadeIn(line2, shift=UP * 0.15), run_time=0.7)
        self.play(Indicate(line2, color=AMBER, scale_factor=1.08), run_time=0.7)
        self.wait(0.9)

        line3 = diagram_label(
            f"M poteau = P × d\n= {fr(P_LOAD)} × {fr(D_POST)} = {fr(M_POTEAU)} kN·m", size=24, color=AMBER
        )
        line3.next_to(line2, DOWN, buff=0.22)
        self.play(FadeIn(line3, shift=UP * 0.15), run_time=0.7)
        self.play(Indicate(line3, color=AMBER, scale_factor=1.08), run_time=0.7)
        self.wait(0.9)

        # The two moment contributions visibly "participate" in the total
        # before it appears, instead of the total just fading in on its own.
        self.play(Indicate(VGroup(line2, line3), color=GREEN, scale_factor=1.05), run_time=0.9)

        total_box_text = diagram_label(
            f"M total = {fr(M_REPARTIE)} + {fr(M_POTEAU)}\n= {fr(M_TOTAL)} kN·m", size=27, color=GREEN, weight=BOLD
        )
        total_box_text.next_to(line3, DOWN, buff=0.35)
        total_box = SurroundingRectangle(total_box_text, color=GREEN, buff=0.18, stroke_width=3)
        self.play(FadeIn(total_box_text, shift=UP * 0.15), Create(total_box), run_time=0.9)
        self.play(Indicate(VGroup(total_box_text, total_box), color=GREEN, scale_factor=1.08), run_time=0.8)

        # Move up to its resting spot right away — with 4 stacked elements
        # this "natural" position sits low enough to reach the caption
        # scrim at the bottom of the frame, so the box doesn't linger
        # there; the settling wait happens only once it's safely higher.
        self.play(FadeOut(line1), FadeOut(line2), FadeOut(line3), run_time=0.5)
        self.play(
            VGroup(total_box_text, total_box).animate.move_to(np.array([0, -1.2, 0])),
            run_time=0.6,
        )
        self.wait(1.3)

        r_badge_text = diagram_label(f"R = {fr(R_REACTION)} kN", size=28, color=GREEN, weight=BOLD)
        r_badge = VGroup(r_badge_text)
        r_badge.next_to(VGroup(total_box_text, total_box), DOWN, buff=0.5)
        self.play(FadeIn(r_badge, shift=UP * 0.15), run_time=0.8)
        self.play(Indicate(r_badge, color=GREEN, scale_factor=1.1), run_time=0.7)
        self.wait(2.6)
