export const DEV = process.env.NODE_ENV?.includes("dev") ?? false;
export const EXPORT_FILE =
  !DEV || ["1", "yes"].includes(process.env.EXPORT ?? "");
export const BEAUTY_EXPORT =
  DEV || ["1", "yes"].includes(process.env.BEAUTIFY ?? "");
export const SCRIPT_ENTRYPOINT =
  process.env.SCRIPT_ENTRYPOINT ?? "MixtrackPlatinumFX";
export const EMPTY_STRING = "\u200b";
