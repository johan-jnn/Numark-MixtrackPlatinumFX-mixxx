import { globSync } from "fs";
import { load } from "../../utils/module";

const outputs = globSync(`${import.meta.dirname}/list/**/*.ts`);

const mappings = await Promise.all(
  outputs.map(async (file) => await load(file)),
).then((a) => a.flat());

export default mappings.length
  ? {
      output: mappings,
    }
  : "\u200b";
