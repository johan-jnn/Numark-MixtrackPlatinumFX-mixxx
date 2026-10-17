import { scriptControl } from "../../../utils";
import { forEachChannel } from "../_utils";

const buttons = new Array(8).fill(null).map((_, i) => i + 1);

export default forEachChannel((channel, index) =>
  buttons.flatMap((button) =>
    [0x14, 0x1c].map((status, shifting) =>
      [0x84, 0x94].map((midi_base, pressing) =>
        scriptControl(
          midi_base + index,
          status,
          `$components.channels[${channel}].pads.active[${button}].input`,
          {
            description: `Channel #${channel} pad button #${button}${pressing ? "" : " (Release)"}${shifting ? " (Shifted)" : ""}`,
          },
        ),
      ),
    ),
  ),
);
