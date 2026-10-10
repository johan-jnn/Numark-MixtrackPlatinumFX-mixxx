import { scriptControl } from "../../utils";
import { forEachChannel } from "./_utils";

export default forEachChannel((channel, index) =>
  [0x80, 0x90].flatMap((base, pressing) =>
    [0x02, 0x03].map((midi, shifting) =>
      scriptControl(
        midi,
        base + index,
        `$components.channels[${channel}].inputs.sync.input`,
        {
          description: `Sync on channel ${channel}${shifting ? " (Shifting)" : ""}${[" (Release)", ""][pressing]}`,
        },
      ),
    ),
  ),
);
