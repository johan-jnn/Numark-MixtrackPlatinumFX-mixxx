import { scriptControl } from "../../utils";
import { forEachChannel } from "./_utils";

export default forEachChannel((channel, index) =>
  [0x80, 0x90].map((base, pressing) =>
    scriptControl(
      0x00,
      base + index,
      `$components.channels[${channel}].inputs.play.input`,
      {
        description: `Play/Pause on channel ${channel}${[" (Release)", ""][pressing]}`,
      },
    ),
  ),
);
