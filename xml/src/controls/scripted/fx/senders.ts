import { type XMLModule } from "../../../../utils/module";
import { scriptControl } from "../../utils";

export default [0, 1].map((index) =>
  scriptControl(
    0x03,
    0xb8 + index,
    `$components.effects.senders[${index + 1}].input`,
    {
      group: "EffectRack1",
      description: `Deck ${index + 1} FX sender`,
    },
  ),
) satisfies XMLModule;
