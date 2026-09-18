import { globSync } from "fs";
import { load } from "../../utils/module";

const outputs = globSync(`${import.meta.dirname}/list/**/*.ts`);

export default {
  output: await Promise.all(outputs.map(async (file) => await load(file))),
};
