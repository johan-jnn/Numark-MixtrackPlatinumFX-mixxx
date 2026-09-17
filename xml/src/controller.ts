import { SCRIPT_ENTRYPOINT } from "../utils/constants";
import { load, type XMLModule } from "../utils/module";

export default {
  scriptfiles: {
    file: [
      ...["lodash.mixxx.js", "midi-components-0.0.js"].map((filename) => ({
        filename,
      })),
      {
        filename: "Numark-Mixtrack-Platinum-FX-scripts.js",
        functionprefix: SCRIPT_ENTRYPOINT,
      },
    ].map((attrs) => ({ "@": attrs, "#": undefined })),
  },
  controls: await load(import.meta.resolve("./controls/controls.ts")),
} satisfies XMLModule;
