import { scriptControl } from "../../utils";
import { forEachChannel } from "./_utils";

export default forEachChannel((channel, index) =>
  [0x80, 0x90].map((status_base, pressing) =>
    scriptControl(
      0x07,
      status_base + index,
      `$components.channels[${channel}].wheel.inputs.switchMode.input`,
      {
        description: `Channel #${channel} wheel mode switcher (${["Release", "Press"][pressing]})`,
      },
    ),
  ),
);
