import React from "react";
import { interpolate, Easing } from "remotion";
import { COLORS } from "../theme";

type Mode =
  | "sink" | "crack" | "collapse" | "cutaway" | "sink_slow"
  | "crack_form" | "rebar" | "underground";

type Props = { mode: Mode; progress: number; accent: string };

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

const Window: React.FC<{ x: number; y: number; w: number; h: number; lit?: boolean }> = ({ x, y, w, h }) => (
  <rect x={x} y={y} width={w} height={h} fill="none" stroke={COLORS.dim} strokeWidth={2.2} />
);

const BuildingBody: React.FC<{ tilt?: number; crackReveal?: number; crackSeed?: number; color?: string }> = ({
  tilt = 0, crackReveal = 0, crackSeed = 1, color = COLORS.ink,
}) => {
  const bw = 260, bh = 520;
  const rows = 7, cols = 3;
  const pad = 22, gap = 14;
  const cellW = (bw - pad * 2 - gap * (cols - 1)) / cols;
  const cellH = (bh - pad * 2 - gap * (rows - 1)) / rows / 1.15;

  // deterministic jagged crack path across the facade
  const rnd = (seedOffset: number) => {
    const x = Math.sin(crackSeed * 999 + seedOffset * 37.13) * 43758.5453;
    return x - Math.floor(x);
  };
  const pts: [number, number][] = [];
  let cx = bw * 0.35;
  let cy = 20;
  pts.push([cx, cy]);
  let i = 0;
  while (cy < bh - 20) {
    cy += 40 + rnd(i) * 30;
    cx += (rnd(i + 50) - 0.5) * 70;
    cx = Math.max(20, Math.min(bw - 20, cx));
    pts.push([cx, Math.min(cy, bh - 20)]);
    i++;
  }
  const pathD = pts.map((p, idx) => `${idx === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const pathLen = pts.reduce((acc, p, idx) => idx === 0 ? 0 : acc + Math.hypot(p[0] - pts[idx - 1][0], p[1] - pts[idx - 1][1]), 0);

  return (
    <g transform={`rotate(${tilt} ${bw / 2} ${bh})`}>
      <rect x={0} y={0} width={bw} height={bh} fill="#151b2c" stroke={color} strokeWidth={4} />
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => (
          <Window key={`${r}-${c}`}
            x={pad + c * (cellW + gap)}
            y={pad + r * (cellH + gap * 1.6)}
            w={cellW} h={cellH} />
        ))
      )}
      <rect x={bw / 2 - 30} y={bh - 70} width={60} height={70} fill="none" stroke={color} strokeWidth={3} />
      {crackReveal > 0 && (
        <path d={pathD} fill="none" stroke={COLORS.danger} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={pathLen} strokeDashoffset={pathLen * (1 - crackReveal)} />
      )}
    </g>
  );
};

const Ground: React.FC<{ y: number; accent: string; deep?: boolean }> = ({ y, accent }) => (
  <g>
    <line x1={-540} y1={y} x2={540} y2={y} stroke={COLORS.ink} strokeWidth={4} />
    <g opacity={0.5}>
      {Array.from({ length: 30 }).map((_, i) => (
        <line key={i} x1={-520 + i * 36} y1={y + 20} x2={-520 + i * 36 - 24} y2={y + 44}
          stroke={COLORS.dim} strokeWidth={2} />
      ))}
    </g>
  </g>
);

export const Building: React.FC<Props> = ({ mode, progress, accent }) => {
  const groundY = 90;
  let tilt = 0, ty = 0, crackReveal = 0, opacity = 1;
  let showFooting = false, footingReveal = 0, rustReveal = 0;
  let collapseBlocks: { dx: number; dy: number; w: number; h: number; rot: number }[] | null = null;

  if (mode === "sink") {
    tilt = interpolate(progress, [0.15, 1], [0, 7], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    ty = interpolate(progress, [0.15, 1], [0, 46], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  } else if (mode === "sink_slow") {
    tilt = interpolate(progress, [0, 1], [2, 5], { easing: Easing.inOut(Easing.ease) });
    ty = interpolate(progress, [0, 1], [10, 26], { easing: Easing.inOut(Easing.ease) });
  } else if (mode === "crack" || mode === "crack_form") {
    tilt = 4;
    ty = 20;
    crackReveal = interpolate(progress, [0.1, 0.85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else if (mode === "rebar") {
    tilt = 5; ty = 30;
    crackReveal = 1;
    rustReveal = interpolate(progress, [0.3, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else if (mode === "cutaway" || mode === "underground") {
    showFooting = true;
    footingReveal = interpolate(progress, [0.1, 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    opacity = mode === "underground" ? interpolate(progress, [0, 0.3], [1, 0.35], { extrapolateRight: "clamp" }) : 1;
  } else if (mode === "collapse") {
    const t = interpolate(progress, [0.2, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
    collapseBlocks = [
      { dx: -70, dy: -260 * (1 - t), w: 150, h: 200, rot: -14 * t },
      { dx: -10, dy: -180 * (1 - t) + 40 * t, w: 130, h: 170, rot: 10 * t },
      { dx: 60, dy: -100 * (1 - t) + 90 * t, w: 150, h: 150, rot: -8 * t },
    ];
    opacity = 1;
  }

  return (
    <svg width="100%" height="100%" viewBox="-540 -700 1080 1000" style={{ overflow: "visible" }}>
      <g opacity={opacity}>
        {!collapseBlocks && (
          <g transform={`translate(${-130} ${-620 + ty})`}>
            <BuildingBody tilt={tilt} crackReveal={crackReveal} crackSeed={mode === "rebar" ? 5 : 2} />
          </g>
        )}
        {collapseBlocks && collapseBlocks.map((b, i) => (
          <g key={i} transform={`translate(${b.dx} ${-140 + b.dy}) rotate(${b.rot})`}>
            <rect x={-b.w / 2} y={-b.h} width={b.w} height={b.h} fill="#151b2c" stroke={COLORS.ink} strokeWidth={4} />
          </g>
        ))}
      </g>
      <Ground y={groundY} accent={accent} />
      {showFooting && (
        <g opacity={footingReveal}>
          <rect x={-180} y={groundY + 10} width={360} height={70} fill="none" stroke={accent} strokeWidth={5} />
          {[-140, -47, 47, 140].map((x, i) => (
            <line key={i} x1={x} y1={groundY} x2={x} y2={groundY - 60} stroke={accent} strokeWidth={4} opacity={0.6} />
          ))}
          <line x1={-260} y1={groundY + 90} x2={260} y2={groundY + 90} stroke={COLORS.dim} strokeWidth={2} strokeDasharray="8 6" opacity={0.5} />
        </g>
      )}
      {mode === "rebar" && (
        <g opacity={rustReveal} transform={`translate(-130 -110)`}>
          <circle r={10} fill={COLORS.danger} opacity={0.7} />
          <circle r={4} fill={COLORS.danger} />
        </g>
      )}
    </svg>
  );
};
