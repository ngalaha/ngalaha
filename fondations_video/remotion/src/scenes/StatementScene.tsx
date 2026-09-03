import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Background } from "../components/Background";
import { accentColor, COLORS, FONT_FAMILY } from "../theme";

export const StatementScene: React.FC<any> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const accent = accentColor(scene.accent);
  const lines: string[] = (scene.big as string).split("\n");
  const words = lines.flatMap((l, li) => l.split(" ").map((w) => ({ w, li })));

  const revealWindow = Math.min(durationInFrames * 0.6, fps * 2.2);
  const perWord = revealWindow / words.length;

  let idx = 0;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Background accent={accent} />
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "0 100px",
      }}>
        <div style={{ width: 64, height: 8, background: accent, marginBottom: 44 }} />
        {lines.map((line, li) => (
          <div key={li} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 18px" }}>
            {line.split(" ").map((w, wi) => {
              const start = idx * perWord;
              idx++;
              const sp = spring({ frame: frame - start, fps, config: { damping: 200, stiffness: 300 } });
              const op = interpolate(frame - start, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <span key={wi} style={{
                  fontFamily: FONT_FAMILY, fontWeight: 900, fontSize: 68, color: COLORS.ink,
                  lineHeight: 1.22, opacity: op,
                  transform: `translateY(${(1 - sp) * 26}px)`,
                  textAlign: "center",
                }}>{w}</span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
