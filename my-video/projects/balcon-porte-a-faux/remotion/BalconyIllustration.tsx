import React from "react";
import { colors } from "../../../engine/remotion/theme";

/**
 * Shared hero illustration: a building with a cantilevered balcony and
 * deliberately no visible support underneath (sells "aucun poteau dessous").
 * Reused across the hook, charges and "retour" scenes with different props.
 *
 * Proportions are deliberately architectural: a 6-storey facade with a
 * roof cap and ground-floor entrance, and a balcony that projects only a
 * modest fraction of the building's width (a real cantilever slab, not a
 * platform wider than the building itself).
 */
export const BalconyIllustration: React.FC<{
  showLoads?: boolean;
  showGlow?: boolean;
  glowOpacity?: number;
  /** Staged reveal for the Charges scene: 0=bare, 1=dalle (pulse), 2=+meubles,
   * 3=+personne, 4=+poteau. Omit to fall back to the all-at-once showLoads. */
  loadStage?: number;
}> = ({ showLoads = false, showGlow = false, glowOpacity = 1, loadStage }) => {
  // Continuous 0-4 value (the caller eases it) rather than an integer
  // stage — each element below fades in over its own 0-1 window instead
  // of popping in on a hard threshold.
  const stage = loadStage ?? (showLoads ? 4 : 0);
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const dalleOpacity = clamp01(stage);
  const furnitureOpacity = clamp01(stage - 1);
  const personOpacity = clamp01(stage - 2);
  const postOpacity = clamp01(stage - 3);
  const windowRows = [110, 205, 300, 395, 490, 585];

  // Balcony sits in the facade gap between the 3rd and 4th floor, and
  // projects only ~37% of the building's width — a credible cantilever
  // slab rather than a platform wider than the building.
  const balconyX = 370;
  const balconyY = 372;
  const balconyDepth = 112;
  const balconyThick = 20;
  const balconyOuterX = balconyX + balconyDepth;

  return (
    <svg viewBox="0 0 800 900" width="100%" height="100%">
      <defs>
        <radialGradient id="junctionGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.amber} stopOpacity={0.55} />
          <stop offset="100%" stopColor={colors.amber} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Roof cap */}
      <rect x={58} y={46} width={324} height={16} fill={colors.navyLight} stroke={colors.mist} strokeWidth={3} />

      {/* Building facade */}
      <rect x="70" y="62" width="300" height="768" fill={colors.navyLight} stroke={colors.mist} strokeWidth={4} />

      {/* Subtle floor-division lines for an architectural facade feel */}
      {[205, 300, 395, 490, 585].map((y) => (
        <line key={y} x1={74} x2={366} y1={y - 15} y2={y - 15} stroke={colors.mist} strokeWidth={1} opacity={0.22} />
      ))}

      {windowRows.map((y) => (
        <React.Fragment key={y}>
          {[115, 245].map((x) => (
            <React.Fragment key={x}>
              <rect x={x} y={y} width="80" height="70" fill={colors.navyDark} stroke={colors.mist} strokeWidth={2.5} />
              <line x1={x + 40} x2={x + 40} y1={y} y2={y + 70} stroke={colors.mist} strokeWidth={1.5} opacity={0.6} />
              <line x1={x} x2={x + 80} y1={y + 35} y2={y + 35} stroke={colors.mist} strokeWidth={1.5} opacity={0.6} />
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}

      {/* Ground-floor entrance */}
      <rect x={195} y={758} width={50} height={72} fill={colors.navyDark} stroke={colors.mist} strokeWidth={2.5} />

      {/* Balcony slab — protrudes right, nothing visible underneath */}
      <rect
        x={balconyX}
        y={balconyY}
        width={balconyDepth}
        height={balconyThick}
        fill={colors.white}
        stroke={colors.mist}
        strokeWidth={3}
      />
      {/* underside shadow line — reads as a solid cantilevered slab with
          genuinely nothing propping it up */}
      <rect x={balconyX} y={balconyY + balconyThick} width={balconyDepth} height={7} fill={colors.navyDark} opacity={0.4} />

      {/* railing */}
      {Array.from({ length: 6 }).map((_, i) => (
        <line
          key={i}
          x1={balconyX + 16 + i * 16}
          y1={balconyY}
          x2={balconyX + 16 + i * 16}
          y2={balconyY - 52}
          stroke={colors.mist}
          strokeWidth={3.5}
        />
      ))}
      <line
        x1={balconyX + 10}
        y1={balconyY - 52}
        x2={balconyOuterX - 4}
        y2={balconyY - 52}
        stroke={colors.mist}
        strokeWidth={3.5}
      />

      {showGlow && (
        <circle cx={balconyX + 15} cy={balconyY + 10} r={95} fill="url(#junctionGlow)" opacity={glowOpacity} />
      )}

      {dalleOpacity > 0 && (
        <rect
          x={balconyX}
          y={balconyY}
          width={balconyDepth}
          height={balconyThick}
          fill="none"
          stroke={colors.amber}
          strokeWidth={5}
          opacity={0.9 * dalleOpacity}
        />
      )}

      {furnitureOpacity > 0 && (
        <g opacity={furnitureOpacity}>
          {/* furniture: small table + two chairs, near the building side */}
          <rect x={392} y={350} width="34" height="7" fill={colors.mist} />
          <rect x={395} y={357} width="4" height="14" fill={colors.mist} />
          <rect x={419} y={357} width="4" height="14" fill={colors.mist} />
          <circle cx={386} cy={363} r={7} fill={colors.mist} />
          <circle cx={432} cy={363} r={7} fill={colors.mist} />
        </g>
      )}

      {personOpacity > 0 && (
        <g opacity={personOpacity}>
          {/* person: simple silhouette standing further out on the slab */}
          <circle cx={452} cy={346} r={8} fill={colors.clay} />
          <path
            d="M 442 372 Q 442 356 452 356 Q 462 356 462 372 L 456 372 L 456 364 L 448 364 L 448 372 Z"
            fill={colors.clay}
          />
        </g>
      )}

      {postOpacity > 0 && (
        <g opacity={postOpacity}>
          {/* post + small roof near the outer end of the slab (~70% out) */}
          <rect x={462} y={298} width="10" height="74" fill={colors.amber} />
          <path d="M 448 298 L 467 274 L 486 298 Z" fill={colors.amberDark} stroke={colors.amber} strokeWidth={2} />
        </g>
      )}
    </svg>
  );
};
