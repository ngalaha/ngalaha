import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneBackground, Kicker, Headline, ProgressDots } from "../components/Shared";
import { PersonIcon, DrillIcon, RulerIcon, FlaskIcon, ReportIcon } from "../components/Icons";
import { colors, bodyFont, headingFont } from "../theme";

const TITLE_END = 150;

const STEPS = [
  {
    icon: PersonIcon,
    label: "Visite de terrain",
    desc: "Un ingénieur géotechnicien se rend sur place pour observer le terrain.",
    start: TITLE_END,
    end: 420,
  },
  {
    icon: DrillIcon,
    label: "Les forages",
    desc: "Des trous profonds sont creusés pour observer les couches du sol.",
    start: 420,
    end: 690,
  },
  {
    icon: RulerIcon,
    label: "Essais de pénétration",
    desc: "On mesure la résistance du sol à différentes profondeurs.",
    start: 690,
    end: 962,
  },
  {
    icon: FlaskIcon,
    label: "Analyse en laboratoire",
    desc: "Les échantillons prélevés sont étudiés : composition, densité, portance.",
    start: 962,
    end: 1234,
  },
  {
    icon: ReportIcon,
    label: "Le rapport détaillé",
    desc: "Toutes les informations sont réunies dans un rapport géotechnique.",
    start: 1234,
    end: 1472,
  },
];

const FADE = 22;

const stepOpacity = (frame: number, start: number, end: number) => {
  const fadeIn = interpolate(frame, [start, start + FADE], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [end - FADE, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return Math.min(fadeIn, fadeOut);
};

const Timeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({ frame: frame - 70, fps, config: { damping: 200 } });
  const trackWidth = 1560;

  return (
    <div
      style={{
        position: "absolute",
        top: 330,
        left: 150,
        width: trackWidth,
        opacity: appear,
        transform: `translateY(${interpolate(appear, [0, 1], [16, 0])}px)`,
      }}
    >
      <div style={{ position: "relative", height: 6, background: "#ffffff22", borderRadius: 3 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: 6,
            borderRadius: 3,
            background: colors.amber,
            width: `${interpolate(
              frame,
              [TITLE_END, STEPS[STEPS.length - 1].end],
              [0, 100],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )}%`,
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: -17 }}>
        {STEPS.map((s, i) => {
          const active = frame >= s.start - 10;
          const current = frame >= s.start && frame < s.end;
          return (
            <div
              key={s.label}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: active ? colors.amber : colors.navy,
                border: `3px solid ${active ? colors.amber : colors.mist}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: bodyFont,
                fontWeight: 700,
                fontSize: 20,
                color: active ? colors.navyDark : colors.mist,
                transform: current ? "scale(1.2)" : "scale(1)",
                boxShadow: current ? `0 0 26px ${colors.amber}88` : "none",
              }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StepPanel: React.FC<{ step: (typeof STEPS)[number]; index: number }> = ({
  step,
  index,
}) => {
  const frame = useCurrentFrame();
  const op = stepOpacity(frame, step.start, step.end);
  if (op <= 0) return null;
  const Icon = step.icon;
  const y = interpolate(op, [0, 1], [26, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: 150,
        top: 470,
        opacity: op,
        transform: `translateY(${y}px)`,
        display: "flex",
        alignItems: "center",
        gap: 46,
      }}
    >
      <div
        style={{
          width: 190,
          height: 190,
          borderRadius: "50%",
          background: colors.navyLight,
          border: `3px solid ${colors.amber}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 50px ${colors.amber}33`,
          flexShrink: 0,
        }}
      >
        <Icon size={92} color={colors.amber} />
      </div>
      <div style={{ maxWidth: 1100 }}>
        <div style={{ fontFamily: bodyFont, fontWeight: 600, fontSize: 26, color: colors.amber, letterSpacing: 2 }}>
          ÉTAPE {index + 1} SUR {STEPS.length}
        </div>
        <div style={{ fontFamily: headingFont, fontWeight: 800, fontSize: 68, color: colors.white, marginTop: 6 }}>
          {step.label}
        </div>
        <div style={{ fontFamily: bodyFont, fontWeight: 400, fontSize: 38, color: colors.mist, marginTop: 16, lineHeight: 1.4 }}>
          {step.desc}
        </div>
      </div>
    </div>
  );
};

export const Scene3Steps: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleP = spring({ frame, fps, config: { damping: 200 } });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <SceneBackground from={colors.navyDark} to="#0c2436" glow={colors.green} />
      <ProgressDots total={5} active={2} />
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 0,
          right: 0,
          opacity: interpolate(titleP, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <Kicker label="03 — LES ÉTAPES CONCRÈTES" accent={colors.green} />
        <Headline text="Comment se déroule une étude de sol ?" maxWidth={1500} fontSize={92} />
      </div>
      <Timeline />
      {STEPS.map((s, i) => (
        <StepPanel key={s.label} step={s} index={i} />
      ))}
    </div>
  );
};
