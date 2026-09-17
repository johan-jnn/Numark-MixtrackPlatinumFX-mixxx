import { type XMLModule } from "../../../utils/module";
import { inputControl } from "../utils";

const controls: XMLModule[] = [];

for (let unit = 1; unit <= 4; unit++) {
  controls.push(
    inputControl(
      {
        id: 0x04,
        status: 0xb8 + ((unit - 1) % 2),
      },
      {
        key: "mix",
        group: `EffectRack1_EffectUnit${unit}`,
      },
      {
        description: `FX Unit ${unit} Mix Knob`,
      },
    ),
  );
}

export default controls;
