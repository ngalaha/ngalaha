import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Background } from "../components/Background";
import { Caption } from "../components/Caption";
import { accentColor, COLORS, FONT_FAMILY } from "../theme";
import { IconHeart, IconBookmark, IconBell } from "../components/Icons";

const ICONS = [IconHeart, IconBookmark, IconBell];
const LABELS = ["J'aime", "Enregistrer", "Suivre"];

export const OutroScene: React.FC<any> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentColor(scene.accent);

  const titleOp = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleTy = interpolate(frame, [0, 20], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Background accent={accent} />
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "0 90px",
      }}>
        <div style={{
          fontFamily: FONT_FAMILY, fontWeight: 900, fontSize: 58, color: COLORS.ink,
          textAlign: "center", opacity: titleOp, transform: `translateY(${titleTy}px)`,
          marginBottom: 90, lineHeight: 1.2,
        }}>Merci de nous suivre</div>

        <div style={{ display: "flex", gap: 60 }}>
          {ICONS.map((Icon, i) => {
            const start = 26 + i * fps * 0.4;
            const sp = spring({ frame: frame - start, fps, config: { damping: 12, stiffness: 180 } });
            const op = interpolate(frame - start, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={i} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                opacity: op, transform: `scale(${sp})`,
              }}>
                <div style={{
                  width: 120, height: 120, borderRadius: 60, background: `${accent}22`,
                  border: `3px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={56} color={accent} />
                </div>
                <div style={{ fontFamily: FONT_FAMILY, fontWeight: 700, fontSize: 26, color: COLORS.dim }}>{LABELS[i]}</div>
              </div>
            );
          })}
        </div>
      </div>

      <Caption cues={scene.cues} sceneStart={scene.start} accent={accent} />
    </div>
  );
};
