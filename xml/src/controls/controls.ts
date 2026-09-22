import { globSync } from "fs";
import { EMPTY_STRING } from "../../utils/constants";
import { load } from "../../utils/module";

const controls = globSync(`${import.meta.dirname}/{direct,scripted}/**/*.ts`);

const mappings = await Promise.all(
  controls.map(async (file) => await load(file)),
).then((a) => a.flat());

export default mappings.length
  ? {
      control: mappings,
    }
  : EMPTY_STRING;
