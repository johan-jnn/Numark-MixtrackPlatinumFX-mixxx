import { type XMLModule } from "../../../utils/module";
import { inputControl, type InputControlOption } from "../utils";

const master: Record<
  string,
  {
    /**
     * First number is the midi id and second is the status
     */
    midi: [number, number];
    description?: string;
    options?: InputControlOption[];
  }
> = {
  gain: {
    midi: [0x23, 0xbe],
  },
  crossfader: {
    midi: [0x08, 0xbf],
  },
  headGain: {
    midi: [0x0c, 0xbf],
  },
  headMix: {
    midi: [0x0d, 0xbf],
  },
};

export default Object.entries(master).map(
  ([key, { midi, description, options }]) =>
    inputControl(
      { id: midi[0], status: midi[1] },
      { key, group: "Master" },
      { options, description },
    ),
) satisfies XMLModule[];
