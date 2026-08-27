import React from "react";
import { AbsoluteFill, staticFile, Video } from "remotion";
import { Kicker, ProgressDots, Beat, colors } from "../Shared";

// Captions sit at the TOP of the frame for the first ~12s (local frame
// < 360), while the overview is still full-size and its ground line only
// starts ~340px down, so top=170 is clear. At local frame 360 the Manim
// scene zooms the overview into a small corner reference (see
// foundation_plan.py Phase C) and packs the detail view densely down the
// rest of the frame — corner overview + "50 cm" label at y=65-345,
// "DÉTAIL SEMELLE" title at y=460-525, "enrobage 3 cm" label at
// y=625-720, rebar box from y=780 down to ~1200 (all measured directly
// off rendered stills) — leaving no clear band near the top. So captions
// after that point switch to bottom-anchored (bottom=550), well below all
// of that content where the frame is empty. Local frame numbers are
// derived from the voiceover's word-timing analysis, not frame-matched to
// the Manim clip's own animation beats — same approach as
// balcon-porte-a-faux's ScrimCaption over its clips.
export const PlanTechniqueScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper }}>
      <Video src={staticFile("manim-render/foundation_plan.webm")} style={{ width: "100%", height: "100%" }} />
      <Kicker label="Le vrai plan" accent={colors.blue} />
      <ProgressDots active={6} />

      <Beat
        text="Voici à quoi ressemble un vrai plan de fondation, pour ce cas précis."
        start={8}
        end={204}
        top={170}
        size={38}
        color={colors.ink}
      />
      <Beat
        text="Une semelle filante de cinquante centimètres de large, vingt-cinq centimètres de haut."
        start={204}
        end={384}
        top={170}
        size={36}
        color={colors.blue}
      />
      <Beat
        text="Un béton de propreté de cinq centimètres, et un enrobage d'armatures de trois centimètres."
        start={384}
        end={595}
        bottom={550}
        size={34}
        color={colors.orange}
      />
      <Beat text="Conforme à l'Eurocode 2." start={595} end={672} bottom={550} size={40} color={colors.green} weight={900} />
    </AbsoluteFill>
  );
};
