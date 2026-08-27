import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { WhitePaper, ProgressDots, Kicker, Beat, Brand, SoilDefs, colors } from "../Shared";

const WALL_LEFT = 60;
const WALL_RIGHT = 240;
const WALL_TOP = 40;
const WALL_BOTTOM = 200;
const ROWS = 8;
const ROW_H = (WALL_BOTTOM - WALL_TOP) / ROWS;
const BRICK_W = 45;

/** Real brick coursing (offset joints every other row) instead of a bare
 * rectangle — drawn as horizontal course lines plus staggered vertical
 * joint ticks, clipped to the wall bounds. */
const BrickCourses: React.FC = () => {
  const rows = Array.from({ length: ROWS });
  return (
    <g>
      <rect x={WALL_LEFT} y={WALL_TOP} width={WALL_RIGHT - WALL_LEFT} height={WALL_BOTTOM - WALL_TOP} fill={`${colors.ink}06`} stroke={colors.ink} strokeWidth={4} />
      {rows.map((_, i) => {
        const y = WALL_TOP + i * ROW_H;
        const offset = i % 2 === 0 ? 0 : BRICK_W / 2;
        const ticks: number[] = [];
        for (let x = WALL_LEFT + offset; x < WALL_RIGHT; x += BRICK_W) {
          if (x > WALL_LEFT + 2) ticks.push(x);
        }
        return (
          <g key={i}>
            {i > 0 && <line x1={WALL_LEFT} y1={y} x2={WALL_RIGHT} y2={y} stroke={colors.gray} strokeWidth={1.4} />}
            {ticks.map((x, j) => (
              <line key={j} x1={x} y1={y} x2={x} y2={y + ROW_H} stroke={colors.gray} strokeWidth={1.4} />
            ))}
          </g>
        );
      })}
    </g>
  );
};

const StampCircle: React.FC<{ cx: number; cy: number; ok: boolean; p: number }> = ({ cx, cy, ok, p }) => (
  <g opacity={p} style={{ transformOrigin: `${cx}px ${cy}px`, transform: `scale(${interpolate(p, [0, 1], [0.5, 1])}) rotate(-8deg)` }}>
    <circle cx={cx} cy={cy} r={26} fill={ok ? `${colors.green}14` : `${colors.red}14`} stroke={ok ? colors.green : colors.red} strokeWidth={4} />
    {ok ? (
      <path d={`M ${cx - 11} ${cy} L ${cx - 3} ${cy + 9} L ${cx + 12} ${cy - 10}`} fill="none" stroke={colors.green} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <>
        <line x1={cx - 10} y1={cy - 10} x2={cx + 10} y2={cy + 10} stroke={colors.red} strokeWidth={4.5} strokeLinecap="round" />
        <line x1={cx + 10} y1={cy - 10} x2={cx - 10} y2={cy + 10} stroke={colors.red} strokeWidth={4.5} strokeLinecap="round" />
      </>
    )}
  </g>
);

const CrackWall: React.FC = () => {
  const frame = useCurrentFrame();
  const crackP = interpolate(frame, [58, 104], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const crackLen = 210;
  const groundY = 222;
  const footingBottom = 248;

  return (
    <svg width={300} height={340} viewBox="0 0 300 340">
      <SoilDefs clayId="cmpClayA" fillId="cmpFillA" />
      <rect x={20} y={groundY} width={260} height={80} fill="url(#cmpClayA)" />
      <BrickCourses />
      <line x1={20} y1={groundY} x2={280} y2={groundY} stroke={colors.ink} strokeWidth={5} />
      <rect x={40} y={groundY} width={180} height={footingBottom - groundY} fill={colors.blue} fillOpacity={0.16} stroke={colors.blue} strokeWidth={3} />

      <path
        d="M 150 222 L 158 202 L 148 184 L 160 168 L 146 150 L 156 132 L 144 114 L 154 96 L 146 78 L 152 58 L 148 40"
        fill="none"
        stroke={colors.red}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={crackLen}
        strokeDashoffset={crackLen * (1 - crackP)}
      />

      <StampCircle cx={258} cy={30} ok={false} p={crackP} />
    </svg>
  );
};

const StableWall: React.FC = () => {
  const frame = useCurrentFrame();
  const okP = interpolate(frame, [374, 400], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const groundY = 222;
  const footingBottom = 292;

  return (
    <svg width={300} height={340} viewBox="0 0 300 340">
      <SoilDefs clayId="cmpClayB" fillId="cmpFillB" />
      <rect x={20} y={groundY} width={260} height={80} fill="url(#cmpClayB)" />
      <BrickCourses />
      <line x1={20} y1={groundY} x2={280} y2={groundY} stroke={colors.ink} strokeWidth={5} />
      <rect x={40} y={groundY} width={180} height={footingBottom - groundY} fill={colors.green} fillOpacity={0.16} stroke={colors.green} strokeWidth={3} />

      <StampCircle cx={258} cy={30} ok={true} p={okP} />
    </svg>
  );
};

export const ComparaisonScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const swipeX = interpolate(frame, [210, 245], [0, -width], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <WhitePaper />
      <Kicker label="La comparaison" accent={colors.green} />
      <ProgressDots active={5} />

      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 320,
            left: 0,
            width: "200%",
            display: "flex",
            transform: `translateX(${swipeX}px)`,
          }}
        >
          <div style={{ width: "50%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <CrackWall />
            <div style={{ fontSize: 34, fontWeight: 800, color: colors.red, marginTop: 4 }}>0,60 m</div>
          </div>
          <div style={{ width: "50%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <StableWall />
            <div style={{ fontSize: 34, fontWeight: 800, color: colors.green, marginTop: 4 }}>1,20 m</div>
          </div>
        </div>
      </div>

      <Beat text="Une fondation à soixante centimètres bouge avec les saisons." start={0} end={58} bottom={640} size={44} color={colors.ink} />
      <Beat text="Le mur se fissure, souvent deux à quatre ans plus tard." start={58} end={208} bottom={640} size={44} color={colors.red} />
      <Beat text="Une fondation à un mètre vingt reste sous cette zone de mouvement." start={210} end={374} bottom={640} size={40} color={colors.ink} />
      <Beat text="Elle ne bouge pas." start={374} end={425} bottom={640} size={54} color={colors.green} weight={900} />
      <Brand />
    </AbsoluteFill>
  );
};
