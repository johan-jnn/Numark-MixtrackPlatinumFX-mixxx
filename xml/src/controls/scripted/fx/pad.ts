import { type XMLModule } from "../../../../utils/module";
import { scriptControl } from "../../utils";

const order = ["HPF", "LPF", "Flanger", "Echo", "Reverb", "Phaser"];

export default order.flatMap((name, index) => {
  const pad = Math.floor(index / 3) + 1;
  const effect = (index % 3) + 1;

  return [0x89, 0x99].map((status, press) =>
    scriptControl(
      index,
      status,
      `$components.effects.pad[${pad}][${effect}].input`,
      {
        group: `EffectRack1_EffectUnit${pad}_Effect${effect}`,
        description: `FX ${name} button (${["Release", "Press"][press]})`,
      },
    ),
  );
}) satisfies XMLModule[];
