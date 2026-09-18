import { outputControl } from "../utils";

export default Array.from(new Array(4)).map((_, index) =>
  outputControl(
    { id: 0x1b, status: 0x90 + index },
    {
      key: "pfl",
      group: `Channel${index + 1}`,
    },
    {
      minimum: 0.5,
      description: `Headset active for channel ${index + 1}`,
    },
  ),
);
