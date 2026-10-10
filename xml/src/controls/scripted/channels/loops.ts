import { scriptControl } from "../../utils";
import { forEachChannel } from "./_utils";

export default forEachChannel((channel, index) =>
  [0x84, 0x94].flatMap((status_base, pressing) => [
    ...[0x40, 0x41].map((midi, shifting) =>
      scriptControl(
        midi,
        status_base + index,
        `$components.channels[${channel}].inputs.loopToggle.input`,
        {
          description: `Channel #${channel} loop toggle${!pressing ? " (Release)" : ""}${shifting ? " (Shifting)" : ""}`,
        },
      ),
    ),
    ...[0x34, 0x36].map((midi, shifting) =>
      scriptControl(
        midi,
        status_base + index,
        `$components.channels[${channel}].inputs.loopHalf.input`,
        {
          description: `Channel #${channel} loop half${!pressing ? " (Release)" : ""}${shifting ? " (Shifting)" : ""}`,
        },
      ),
    ),
    ...[0x35, 0x37].map((midi, shifting) =>
      scriptControl(
        midi,
        status_base + index,
        `$components.channels[${channel}].inputs.loopDouble.input`,
        {
          description: `Channel #${channel} loop double${!pressing ? " (Release)" : ""}${shifting ? " (Shifting)" : ""}`,
        },
      ),
    ),
  ]),
);
