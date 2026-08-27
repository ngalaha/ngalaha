import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { WhitePaper, ProgressDots, Kicker, Beat, Brand, colors } from "../Shared";

export const ProblemeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const sweepP = interpolate(frame, [10, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <WhitePaper />
      <Kicker label="Le vrai problème" accent={colors.orange} />
      <ProgressDots active={2} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center" }}>
        <svg width={500} height={280} viewBox="0 0 500 280">
          <line x1={40} y1={30} x2={460} y2={30} stroke={colors.ink} strokeWidth={5} />
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1={60 + i * 34}
              y1={30}
              x2={40 + i * 34}
              y2={250}
              stroke={colors.gray}
              strokeWidth={2}
            />
          ))}
          <text
            x={70}
            y={110}
            fontSize={40}
            fontWeight={800}
            fill={colors.orange}
            fontFamily="Arial Black"
            opacity={sweepP}
            transform={`translate(0 ${interpolate(sweepP, [0, 1], [14, 0])})`}
          >
            ARGILE
          </text>
        </svg>
      </div>

      <Beat text="Mais ce terrain est argileux." start={0} end={50} bottom={640} size={54} color={colors.ink} />
      <Beat
        text="Et sur un sol argileux, une deuxième règle s'applique, totalement indépendante du gel."
        start={50}
        end={255}
        bottom={480}
        size={44}
        color={colors.orange}
        highlight={`${colors.orange}18`}
      />
      <Brand />
    </AbsoluteFill>
  );
};
