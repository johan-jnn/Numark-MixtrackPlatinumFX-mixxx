import { jsXml } from "json-xml-parse";
import { join } from "path";
import { load, type XMLModule } from "./utils/module";

const DEV = process.env.NODE_ENV?.includes("dev") ?? false;

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
    encoding: "UTF-8",
    version: "1.0",
  },
  beautify: process.env.NODE_ENV === "dev",
});

DEV && console.log("OUTPUT:\n", xml);

const output = join(
  import.meta.dirname,
  "../Numark Mixtrack Platinum FX.midi.temp.xml",
);

// writeFileSync(output, xml, { encoding: "utf-8" });
