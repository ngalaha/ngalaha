import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Background } from "../components/Background";
import { accentColor, accentFill, COLORS, FONT_FAMILY } from "../theme";
import * as Icons from "../components/Icons";

const ICONS: Record<string, React.FC<{ size?: number; color?: string }>> = {
  scale: Icons.IconScale, layers: Icons.IconLayers, arrows: Icons.IconArrows, clock: Icons.IconClock,
  magnifier: Icons.IconMagnifier, soil: Icons.IconSoil, weight: Icons.IconWeight, wind: Icons.IconWind,
  door: Icons.IconDoor, window: Icons.IconWindow, pipe: Icons.IconPipe, warning: Icons.IconWarning,
  drill: Icons.IconDrill, check: Icons.IconCheck, cross: Icons.IconCross, coin: Icons.IconCoin,
  footing: Icons.IconFooting, water: Icons.IconWater, cave: Icons.IconCave,
};

export const ChecklistScene: React.FC<any> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const accent = accentColor(scene.accent);
  const fill = accentFill(scene.accent);
  const items = scene.items as { icon: string; text: string }[];

  const titleOp = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stagger = Math.min(fps * 0.5, (durationInFrames * 0.6) / items.length);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Background accent={accent} />
      <div style={{ position: "absolute", left: 90, right: 90, top: 300 }}>
        <div style={{
          fontFamily: FONT_FAMILY, fontWeight: 800, fontSize: 44, color: COLORS.ink,
          opacity: titleOp, marginBottom: 56, lineHeight: 1.25,
        }}>{scene.title}</div>

        {items.map((item, i) => {
          const start = 16 + i * stagger;
          const sp = spring({ frame: frame - start, fps, config: { damping: 200, stiffness: 220 } });
          const op = interpolate(frame - start, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const Icon = ICONS[item.icon] ?? Icons.IconCheck;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 28, marginBottom: 34,
              opacity: op, transform: `translateX(${(1 - sp) * -50}px)`,
            }}>
              <div style={{
                width: 84, height: 84, minWidth: 84, borderRadius: 20, background: fill,
                border: `2px solid ${accent}55`, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={44} color={accent} />
              </div>
              <div style={{
                fontFamily: FONT_FAMILY, fontWeight: 600, fontSize: 36, color: COLORS.ink, lineHeight: 1.3,
              }}>{item.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
