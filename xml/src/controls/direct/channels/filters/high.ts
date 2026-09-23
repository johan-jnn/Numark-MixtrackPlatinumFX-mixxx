import { forEachChannel } from "../../../scripted/channels/_utils";
import { inputControl } from "../../../utils";

export default forEachChannel(
  (channel, index) =>
    inputControl(
      {
        id: 0x17,
        status: 0xb0 + index,
      },
      {
        key: "parameter3",
        group: `EqualizerRack1_[Channel${channel}]_Effect1`,
      },
      {
        options: ["soft-takeover"],
        description: `Channel ${channel} high filter`,
      },
    ),
  true,
);
