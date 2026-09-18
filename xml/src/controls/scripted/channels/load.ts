import { scriptControl } from "../../utils";
import { forEachChannel } from "./_utils";

export default forEachChannel((channel, index) =>
  [0x8f, 0x9f].map((status, pressing) =>
    scriptControl(
      0x02 + index,
      status,
      `MixtrackPlatinumFX.$components.channels[${channel}].inputs.load.input`,
      {
        group: `Channel${channel}`,
        description: `Load to channel ${channel}${[" (Release)", ""][pressing]}`,
      },
    ),
  ),
);
