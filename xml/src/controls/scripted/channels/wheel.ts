import { scriptControl } from "../../utils";
import { forEachChannel } from "./_utils";

export default forEachChannel((channel, index) =>
  [0xb0, 0x90].map((status_base, touching) =>
    scriptControl(
      0x06,
      status_base + index,
      `$components.channels[${channel}].wheel.${["inputWheel", "inputTouch"][touching]}`,
      {
        description: `Channel #${channel} wheel ${["turn", "touch"][touching]}`,
      },
    ),
  ),
);
