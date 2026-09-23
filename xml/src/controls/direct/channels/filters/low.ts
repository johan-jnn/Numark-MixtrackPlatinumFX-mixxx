import { forEachChannel } from "../../../scripted/channels/_utils";
import { inputControl } from "../../../utils";

export default forEachChannel(
  (channel, index) =>
    inputControl(
      {
        id: 0x19,
        status: 0xb0 + index,
      },
      {
        key: "parameter1",
        group: `EqualizerRack1_[Channel${channel}]_Effect1`,
      },
      {
        options: ["soft-takeover"],
        description: `Channel ${channel} low filter`,
      },
    ),
  true,
);
