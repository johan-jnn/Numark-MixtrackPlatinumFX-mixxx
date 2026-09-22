import { scriptControl } from "../../utils";
import { forEachChannel } from "./_utils";

export default forEachChannel((channel, index) =>
  [0x80, 0x90].map((status_base, pressing) =>
    scriptControl(
      0x1b,
      status_base + index,
      `$components.channels[${channel}].inputs.pfl.input`,
      {
        description: `PFL button for channel ${channel}${[" (Release)", ""][pressing]}`,
      },
    ),
  ),
);
