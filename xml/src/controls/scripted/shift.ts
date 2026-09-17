import { type XMLModule } from "../../../utils/module";
import { scriptControl } from "../utils";

const controls: XMLModule[] = [];

for (const shift of [0, 1]) {
  for (const side of [0, 1]) {
    controls.push(
      scriptControl(
        0x20,
        [0x80, 0x90][side] + shift,
        ["shift", "unshift"][shift],
        {
          description: `${["Left", "Right"][side]} Shift (${["Release", "Press"][shift]})`,
        },
      ),
    );
  }
}

export default controls;
