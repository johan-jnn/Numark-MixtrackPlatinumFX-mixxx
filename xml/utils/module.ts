import type { InputData } from "json-xml-parse/lib/js-xml/interface";

export interface XMLModule extends InputData {
  "#"?: XMLModule | string;
  "@"?: Record<string, string | boolean>;
}

export async function load(module: string): Promise<XMLModule> {
  return import(module).then((m) => m.default);
}
