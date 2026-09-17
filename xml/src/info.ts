import type { XMLModule } from "../utils/module";

const description = `
Mapping for the Numark Mixtrack Platinum FX.

Repository : https://github.com/johan-jnn/Numark-MixtrackPlatinumFX-mixxx
Personnal Website : https://johan-janin.com
`.trim();

export default {
  name: "Numark Mixtrack Platinum FX",
  author:
    "Johan JANIN, based on the work of QGazQ, Octopussy, h67ma, bad1dea5, photoenix, Matthew, Nicholson, Ending & Kaj Bostrom",
  description,
  forums:
    "https://mixxx.discourse.group/t/numark-mixtrack-platinum-fx-mapping/19985",
} satisfies XMLModule;
