import { forEachChannel } from "../../scripted/channels/_utils";
import { inputControl } from "../../utils";

export default forEachChannel((channel, index) =>
  inputControl(
    {
      id: 0x1c,
      status: 0xb0 + index,
    },
    {
      key: "volume",
      group: `Channel${channel}`,
    },
    {
      options: ["soft-takeover"],
      description: `Channel #${channel} gain`,
    },
  ),
);
