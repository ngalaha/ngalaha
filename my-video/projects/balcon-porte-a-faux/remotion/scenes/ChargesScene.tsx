import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneBackground, Kicker } from "../../../../engine/remotion/components/Shared";
import { useFormat } from "../../../../engine/remotion/format-context";
import { colors, bodyFont } from "../../../../engine/remotion/theme";
import { BalconyIllustration } from "../BalconyIllustration";

const easeInOut = Easing.inOut(Easing.ease);

const SentenceBeat: React.FC<{ text: string; start: number; end: number }> = ({ text, start, end }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const format = useFormat();
  const inP = spring({ frame: frame - start, fps, config: { damping: 200, mass: 0.7 } });
  const outP = interpolate(frame, [end - 14, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });
  const opacity = Math.min(interpolate(inP, [0, 1], [0, 1], { extrapolateRight: "clamp" }), outP);
  if (frame < start - 2 || opacity <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: format.safeX,
        right: format.safeX,
        top: 220,
        textAlign: "center",
        fontFamily: bodyFont,
        fontWeight: 600,
        fontSize: 48,
        lineHeight: 1.35,
        color: colors.white,
        opacity,
        transform: `translateY(${interpolate(inP, [0, 1], [20, 0])}px)`,
      }}
    >
      {text}
    </div>
  );
};

export const ChargesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const loadsP = spring({ frame: frame - 10, fps, config: { damping: 200 } });

  // Staged reveal synced to the narration naming each load in turn:
  // "dalle, meubles, une personne" (first sentence) then "un poteau"
  // (second). Each stage crossfades in over a short window instead of
  // popping in on a hard frame cut, and BalconyIllustration turns this
  // continuous 0-4 value into a per-element fade.
  const loadStage = interpolate(
    frame,
    [15, 25, 50, 60, 85, 95, 155, 165],
    [0, 1, 1, 2, 2, 3, 3, 4],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut }
  );

  return (
    <AbsoluteFill>
      <SceneBackground from={colors.navyDark} to="#241d10" glow={colors.clay} />
      <Kicker label="CE QUE PORTE LE BALCON" accent={colors.clay} />

      <SentenceBeat
        text="Sur toute sa longueur, le balcon porte du poids : dalle, meubles, personnes."
        start={5}
        end={145}
      />
      <SentenceBeat
        text="Et là, un poteau ajoute son propre poids, à un endroit précis."
        start={150}
        end={267}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 480,
          height: 900,
          opacity: interpolate(loadsP, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <BalconyIllustration loadStage={loadStage} />
      </div>
    </AbsoluteFill>
  );
};
