import { DEV, SCRIPT_ENTRYPOINT } from "../../utils/constants";
import type { XMLModule } from "../../utils/module";

export type InputControlOption =
  | "normal"
  | "script-binding"
  | "selectknob"
  | "diff"
  | "rot64"
  | "rot64inv"
  | "rot64fast"
  | "switch"
  | "spread64"
  | "soft-takeover"
  | "fourteen-bit-lsb"
  | "fourteen-bit-msb"
  | "invert";

export function inputControl(
  midi: {
    id: number;
    status: number;
  },
  path: {
    key: string;
    group: string;
  },
  extra?: { options?: InputControlOption[]; description?: string },
) {
  if (!path.group.startsWith("[")) path.group = `[${path.group}`;
  if (!path.group.endsWith("]")) path.group += `]`;

  const control: XMLModule = {
    midino: DEV ? `0x${midi.id.toString(16)}` : midi.id,
    status: DEV ? `0x${midi.status.toString(16)}` : midi.id,
    ...path,
  };

  if (extra?.description && DEV) {
    control["@"] = { for: extra?.description };
  }
  if (extra?.options?.length) {
    control["options"] = extra.options.reduce(
      (options, option) => ({
        ...options,
        [option]: [],
      }),
      {},
    );
  }
  return control;
}

export function scriptControl(
  midi: number,
  status: number,
  src: string,
  extra: {
    group?: string;
    options?: Omit<InputControlOption, "script-binding" | "normal">[];
    description?: string;
  } = {},
): XMLModule {
  if (!src.startsWith(SCRIPT_ENTRYPOINT)) {
    src = `${SCRIPT_ENTRYPOINT}.${src}`;
  }
  return inputControl(
    {
      id: midi,
      status,
    },
    {
      key: src,
      group: extra.group ?? "Master",
    },
    {
      description: extra.description,
      options: [
        ...(extra.options ?? []),
        "script-binding",
      ] as InputControlOption[],
    },
  );
}
