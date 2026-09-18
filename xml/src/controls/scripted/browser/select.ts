import { type XMLModule } from "../../../../utils/module";
import { scriptControl } from "../../utils";

export default [0x8f, 0x9f].flatMap((status, pressing) =>
  [0, 1].map((shifting) =>
    scriptControl(
      0x07 - shifting,
      status,
      "$components.browser.selector.input",
      {
        group: "Library",
        description: `Browser selector${["", " (Shifted)"][shifting]}${[" (Release)", ""][pressing]}`,
      },
    ),
  ),
) satisfies XMLModule[];
