import { scriptControl } from "../../utils";
import { forEachChannel } from "./_utils";

export default forEachChannel((channel, index) =>
  scriptControl(
    0x08,
    0x90 + index,
    `MixtrackPlatinumFX.$components.decks[${(index % 2) + 1}].switch`,
    {
      description: `Switch to channel ${channel}`,
    },
  ),
);
