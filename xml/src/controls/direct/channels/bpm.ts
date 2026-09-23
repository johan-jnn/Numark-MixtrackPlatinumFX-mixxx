import { forEachChannel } from "../../scripted/channels/_utils";
import { inputControl } from "../../utils";

export default forEachChannel((channel, index) =>
  inputControl(
    {
      id: 0x09,
      status: 0xb0 + index,
    },
    {
      key: "rate",
      group: `Channel${channel}`,
    },
    {
      options: ["soft-takeover", "invert"],
      description: `Channel #${channel} bpm rate`,
    },
  ),
);
