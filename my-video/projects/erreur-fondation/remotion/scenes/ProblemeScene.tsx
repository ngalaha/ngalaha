import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { WhitePaper, ProgressDots, Kicker, Beat, Brand, SoilDefs, colors, monoFont } from "../Shared";

// A real two-layer geotechnical soil column (topsoil + clay, using the
// French "argile" lens symbol) with leader-line labels sitting in clear
// space beside the hatching — never printed over the drawn lines.
export const ProblemeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enterP = interpolate(frame, [6, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const clayP = interpolate(frame, [22, 46], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const colLeft = 70;
  const colRight = 300;
  const groundY = 40;
  const topsoilBottom = 96;
  const clayBottom = 470;

  return (
    <AbsoluteFill>
      <WhitePaper />
      <Kicker label="Le vrai problème" accent={colors.orange} />
      <ProgressDots active={2} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center" }}>
        <svg width={620} height={520} viewBox="0 0 620 520">
          <SoilDefs clayId="probClay" fillId="probFill" />

          <g style={{ opacity: enterP }}>
            <rect x={colLeft} y={groundY} width={colRight - colLeft} height={topsoilBottom - groundY} fill="url(#probFill)" opacity={0.55} />
            <line x1={colLeft} y1={groundY} x2={colRight} y2={groundY} stroke={colors.ink} strokeWidth={5} />
            <rect x={colLeft} y={groundY} width={colRight - colLeft} height={topsoilBottom - groundY} fill="none" stroke={colors.ink} strokeWidth={2} />

            {/* leader: terre végétale */}
            <line x1={colRight} y1={(groundY + topsoilBottom) / 2} x2={colRight + 40} y2={(groundY + topsoilBottom) / 2} stroke={colors.gray} strokeWidth={1.5} />
            <circle cx={colRight} cy={(groundY + topsoilBottom) / 2} r={3} fill={colors.gray} />
            <text x={colRight + 48} y={(groundY + topsoilBottom) / 2 + 5} fontSize={16} fontFamily={monoFont} fill={colors.gray}>
              terre végétale
            </text>
          </g>

          <g style={{ opacity: clayP }}>
            <rect x={colLeft} y={topsoilBottom} width={colRight - colLeft} height={clayBottom - topsoilBottom} fill="url(#probClay)" />
            <rect x={colLeft} y={topsoilBottom} width={colRight - colLeft} height={clayBottom - topsoilBottom} fill="none" stroke={colors.ink} strokeWidth={2} />
            <line x1={colLeft} y1={topsoilBottom} x2={colRight} y2={topsoilBottom} stroke={colors.gray} strokeWidth={1.5} strokeDasharray="6,5" />

            {/* leader: ARGILE, the payoff label */}
            <line x1={colRight} y1={280} x2={colRight + 40} y2={280} stroke={colors.orange} strokeWidth={2} />
            <circle cx={colRight} cy={280} r={4} fill={colors.orange} />
            <text x={colRight + 48} y={288} fontSize={34} fontWeight={800} fontFamily="Arial Black" fill={colors.orange}>
              ARGILE
            </text>
          </g>
        </svg>
      </div>

      <Beat text="Mais ce terrain est argileux." start={0} end={50} bottom={620} size={54} color={colors.ink} />
      <Beat
        text="Et sur un sol argileux, une deuxième règle s'applique, totalement indépendante du gel."
        start={50}
        end={255}
        bottom={460}
        size={44}
        color={colors.orange}
        highlight={`${colors.orange}18`}
      />
      <Brand />
    </AbsoluteFill>
  );
};
