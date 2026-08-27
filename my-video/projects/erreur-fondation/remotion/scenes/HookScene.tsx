import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { WhitePaper, ProgressDots, Kicker, Beat, Brand, SoilDefs, colors, monoFont } from "../Shared";

// A miniature technical cross-section — not a placeholder shape — that
// draws itself on (ground line, soil fill, footing) exactly like a real
// plan being sketched, then cracks open the moment line 2 lands. Sets the
// "professional drawing" tone from frame 1 instead of a plain rectangle.
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const groundP = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const soilP = interpolate(frame, [10, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const footingP = interpolate(frame, [18, 38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const crackP = interpolate(frame, [66, 104], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const groundLen = 320;
  const crackLen = 210;

  return (
    <AbsoluteFill>
      <WhitePaper />
      <Kicker label="Génie civil" />
      <ProgressDots active={0} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 230, display: "flex", justifyContent: "center" }}>
        <svg width={440} height={480} viewBox="0 0 440 480">
          <SoilDefs clayId="hookClay" fillId="hookFill" />
          <g clipPath="url(#hookClip)">
            <clipPath id="hookClip">
              <rect x={60} y={130} width={320} height={190} />
            </clipPath>
            <rect x={60} y={130} width={320} height={190} fill="url(#hookFill)" opacity={soilP * 0.7} />
          </g>

          <line
            x1={60} y1={130} x2={380} y2={130}
            stroke={colors.ink} strokeWidth={5}
            strokeDasharray={groundLen} strokeDashoffset={groundLen * (1 - groundP)}
          />

          <rect
            x={160} y={170} width={120} height={64}
            fill={colors.blue} fillOpacity={footingP * 0.16}
            stroke={colors.blue} strokeWidth={4}
            strokeDasharray={368} strokeDashoffset={368 * (1 - footingP)}
          />

          <path
            d="M 214 234 L 224 210 L 202 190 L 220 168 L 206 146 L 216 122"
            fill="none"
            stroke={colors.red}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={crackLen}
            strokeDashoffset={crackLen * (1 - crackP)}
            opacity={crackP > 0 ? 1 : 0}
          />

          <text x={60} y={352} fontSize={16} fontFamily={monoFont} fill={colors.gray} opacity={groundP}>
            COUPE — ÉCH. 1/50
          </text>
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
