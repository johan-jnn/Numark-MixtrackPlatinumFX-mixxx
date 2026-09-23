import { forEachChannel } from "../../../scripted/channels/_utils";
import { inputControl } from "../../../utils";

export default forEachChannel(
  (channel, index) =>
    inputControl(
      {
        id: 0x1a,
        status: 0xb0 + index,
      },
      {
        key: "super1",
        group: `[QuickEffectRack1_[Channel${channel}]]`,
      },
      {
        options: ["soft-takeover"],
        description: `Channel ${channel} dynamic filter`,
      },
    ),
  true,
);
