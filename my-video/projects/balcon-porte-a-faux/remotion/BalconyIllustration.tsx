import React from "react";
import { colors } from "../../../engine/remotion/theme";

/**
 * Shared hero illustration: a building with a cantilevered balcony and
 * deliberately no visible support underneath (sells "aucun poteau dessous").
 * Reused across the hook, charges and "retour" scenes with different props.
 */
export const BalconyIllustration: React.FC<{
  showLoads?: boolean;
  showGlow?: boolean;
  glowOpacity?: number;
  /** Staged reveal for the Charges scene: 0=bare, 1=dalle (pulse), 2=+meubles,
   * 3=+personne, 4=+poteau. Omit to fall back to the all-at-once showLoads. */
  loadStage?: number;
}> = ({ showLoads = false, showGlow = false, glowOpacity = 1, loadStage }) => {
  const stage = loadStage ?? (showLoads ? 4 : 0);
  const windowRows = [180, 280, 380, 480, 580];
  return (
    <svg viewBox="0 0 800 900" width="100%" height="100%">
      <defs>
        <radialGradient id="junctionGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.amber} stopOpacity={0.55} />
          <stop offset="100%" stopColor={colors.amber} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Building */}
      <rect x="70" y="70" width="300" height="760" fill={colors.navyLight} stroke={colors.mist} strokeWidth={4} />
      {windowRows.map((y) => (
        <React.Fragment key={y}>
          <rect x="115" y={y} width="80" height="70" fill={colors.navyDark} stroke={colors.mist} strokeWidth={2.5} />
          <rect x="245" y={y} width="80" height="70" fill={colors.navyDark} stroke={colors.mist} strokeWidth={2.5} />
        </React.Fragment>
      ))}

      {/* Balcony slab — protrudes right, nothing visible underneath */}
      <rect x="370" y="368" width="330" height="32" fill={colors.white} stroke={colors.mist} strokeWidth={3} />
      {/* railing */}
      {Array.from({ length: 10 }).map((_, i) => (
        <line
          key={i}
          x1={390 + i * 32}
          y1={368}
          x2={390 + i * 32}
          y2={300}
          stroke={colors.mist}
          strokeWidth={4}
        />
      ))}
      <line x1={385} y1={300} x2={695} y2={300} stroke={colors.mist} strokeWidth={4} />

      {showGlow && (
        <circle cx={385} cy={384} r={110} fill="url(#junctionGlow)" opacity={glowOpacity} />
      )}

      {stage >= 1 && (
        <rect
          x="370"
          y="368"
          width="330"
          height="32"
          fill="none"
          stroke={colors.amber}
          strokeWidth={5}
          opacity={0.9}
        />
      )}

      {stage >= 2 && (
        <>
          {/* furniture: table + two chairs, simple shapes */}
          <rect x={440} y={340} width="60" height="10" fill={colors.mist} />
          <rect x={445} y={350} width="6" height="18" fill={colors.mist} />
          <rect x={489} y={350} width="6" height="18" fill={colors.mist} />
          <circle cx={415} cy={358} r={10} fill={colors.mist} />
          <circle cx={520} cy={358} r={10} fill={colors.mist} />
        </>
      )}

      {stage >= 3 && (
        <>
          {/* person: simple silhouette standing on the slab */}
          <circle cx={565} cy={338} r={11} fill={colors.clay} />
          <path
            d="M 553 368 Q 553 348 565 348 Q 577 348 577 368 L 570 368 L 570 358 L 560 358 L 560 368 Z"
            fill={colors.clay}
          />
        </>
      )}

      {stage >= 4 && (
        <>
          {/* post + small roof near the outer end (~70% of slab) */}
          <rect x={636} y={230} width="14" height="138" fill={colors.amber} />
          <path d="M 600 230 L 645 200 L 690 230 Z" fill={colors.amberDark} stroke={colors.amber} strokeWidth={2} />
        </>
      )}
    </svg>
  );
};
