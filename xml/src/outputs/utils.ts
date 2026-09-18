import { DEV } from "../../utils/constants";
import type { XMLModule } from "../../utils/module";

export type OutputControlOption = "on" | "off" | "minimum" | "maximum";

export function outputControl(
  midi: {
    id: number;
    status: number;
  },
  path: {
    key: string;
    group: string;
  },
  extra: Partial<Record<OutputControlOption, number>> & {
    description?: string;
  } = {},
) {
  if (!path.group.startsWith("[")) path.group = `[${path.group}`;
  if (!path.group.endsWith("]")) path.group += `]`;

  const control: XMLModule = {
    midino: `0x${midi.id.toString(16)}`,
    status: `0x${midi.status.toString(16)}`,
    ...path,
  };

  if (extra.description && DEV) {
    control["@"] = { for: extra.description };
  }
  delete extra.description;

  Object.assign(control, extra);
  return control;
}
