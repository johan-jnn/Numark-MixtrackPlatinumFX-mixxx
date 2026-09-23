import { existsSync, mkdirSync, writeFileSync } from "fs";
import { jsXml } from "json-xml-parse";
import { dirname, join } from "path";
import { BEAUTY_EXPORT, DEV, EXPORT_FILE } from "./utils/constants";
import { load, type XMLModule } from "./utils/module";

const input = {
  MixxxControllerPreset: {
    "@": {
      schemaVersion: "1",
      mixxxVersion: "2.3.0+",
    },
    info: await load(import.meta.resolve("./src/info.ts")),
    controller: await load(import.meta.resolve("./src/controller.ts")),
  },
} satisfies XMLModule;

DEV && console.log("INPUT:\n", JSON.stringify(input, undefined, 2));

const xml = jsXml.toXmlString(input, {
  declaration: {
    version: "1.0",
    encoding: "UTF-8",
  },
  beautify: BEAUTY_EXPORT,
});

DEV && !EXPORT_FILE && console.log("OUTPUT:\n", xml);

const output =
  process.env.OUTPUT ??
  join(import.meta.dirname, "../Numark Mixtrack Platinum FX.midi.xml");

if (EXPORT_FILE) {
  const directory = dirname(output);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
  writeFileSync(output, xml, { encoding: "utf-8" });
}
