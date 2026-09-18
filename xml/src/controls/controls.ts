import { globSync } from "fs";
import { load } from "../../utils/module";

const controls = globSync(`${import.meta.dirname}/{direct,scripted}/**/*.ts`);

const mappings = await Promise.all(
  controls.map(async (file) => await load(file)),
).then((a) => a.flat());

export default mappings.length
  ? {
      control: mappings,
    }
  : "\u200b";
