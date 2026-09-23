import { forEachChannel } from "../../scripted/channels/_utils";
import { inputControl } from "../../utils";

export default forEachChannel((channel, index) =>
  inputControl(
    {
      id: 0x16,
      status: 0xb0 + index,
    },
    {
      key: "pregain",
      group: `Channel${channel}`,
    },
    {
      options: ["soft-takeover"],
      description: `Channel #${channel} gain`,
    },
  ),
);
