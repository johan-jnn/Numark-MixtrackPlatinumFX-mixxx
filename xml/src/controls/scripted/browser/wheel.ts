import { type XMLModule } from "../../../../utils/module";
import { scriptControl } from "../../utils";

export default [0, 1].map((shift) =>
  scriptControl(shift, 0xbf, "$components.browser.knob.input", {
    group: "Library",
    description: `Browse wheel${shift ? " (Shifted)" : ""}`,
  }),
) satisfies XMLModule;
