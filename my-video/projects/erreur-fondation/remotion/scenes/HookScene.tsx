import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { WhitePaper, ProgressDots, Kicker, Beat, Brand, colors } from "../Shared";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const drawP = interpolate(frame, [0, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const perimeter = 2 * (240 + 140);

  return (
    <AbsoluteFill>
      <WhitePaper />
      <Kicker label="Génie civil" />
      <ProgressDots active={0} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 260, display: "flex", justifyContent: "center" }}>
        <svg width={360} height={220} viewBox="0 0 360 220">
          <rect
            x={60} y={40} width={240} height={140}
            fill="none" stroke={colors.blue} strokeWidth={6}
            strokeDasharray={perimeter} strokeDashoffset={perimeter * (1 - drawP)}
          />
        </svg>
      </div>

      <Beat text="Cette fondation respecte la norme." start={4} end={62} bottom={640} size={58} color={colors.ink} />
      <Beat
        text="Et pourtant... elle va fissurer."
        start={64}
        end={150}
        bottom={520}
        size={62}
        color={colors.red}
        highlight={`${colors.red}22`}
      />
      <Brand />
    </AbsoluteFill>
  );
};
