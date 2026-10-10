import { scriptControl } from "../../utils";
import { forEachChannel } from "./_utils";

export default forEachChannel((channel, index) =>
  [0x0b, 0x0c].flatMap((midi_base, bendDown) =>
    [0x80, 0x90].map((status_base, pressing) =>
      [0x00, 0x20].map((midi, shifting) =>
        scriptControl(
          midi_base + midi,
          status_base + index,
          `$components.channels[${channel}].inputs.pitchBend${bendDown ? "Down" : "Up"}.input`,
          {
            description: `Channel #${channel} pitch bend ${bendDown ? "down" : "up"}${shifting ? " (Shifted)" : ""}${pressing ? "" : " (Release)"}`,
          },
        ),
      ),
    ),
  ),
);
