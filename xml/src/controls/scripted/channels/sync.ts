import { scriptControl } from "../../utils";
import { forEachChannel } from "./_utils";

export default forEachChannel((channel, index) =>
  [0x80, 0x90].map((base, pressing) =>
    scriptControl(
      0x02,
      base + index,
      `$components.channels[${channel}].inputs.sync.input`,
      {
        description: `Sync on channel ${channel}${[" (Release)", ""][pressing]}`,
      },
    ),
  ),
);
