import { globSync } from "fs";
import { EMPTY_STRING } from "../../utils/constants";
import { load } from "../../utils/module";

const outputs = globSync(`${import.meta.dirname}/list/**/*.ts`);

const mappings = await Promise.all(
  outputs.map(async (file) => await load(file)),
).then((a) => a.flat());

export default mappings.length
  ? {
      output: mappings,
    }
  : EMPTY_STRING;
