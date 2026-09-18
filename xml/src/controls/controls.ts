import { globSync } from "fs";
import { load } from "../../utils/module";

const controls = globSync(`${import.meta.dirname}/{direct,scripted}/**/*.ts`);

export default {
  control: await Promise.all(controls.map(async (file) => await load(file))),
};
