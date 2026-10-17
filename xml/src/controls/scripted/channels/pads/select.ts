import { scriptControl } from "../../../utils";
import { forEachChannel } from "../_utils";

const sections = {
  cues: [0x00, 0x02],
  autoloops: [0x0d],
  fadercuts: [0x07],
  samplers: [0x0b, 0x0f],
};

export default forEachChannel((channel, index) =>
  Object.entries(sections).flatMap(([section, status]) =>
    status.map((status, shifting) =>
      [0x84, 0x94].map((midi_base, pressing) =>
        scriptControl(
          midi_base + index,
          status,
          `$components.channels[${channel}].pads.${section}.inputs.select.input`,
          {
            description: `Channel #${channel} ${section} pad section selector${pressing ? "" : " (Release)"}${shifting ? " (Shifted)" : ""}`,
          },
        ),
      ),
    ),
  ),
);
