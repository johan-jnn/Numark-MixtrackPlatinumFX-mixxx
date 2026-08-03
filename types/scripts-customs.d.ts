namespace mpfx {
  type Binded<To, Key = "mpfx"> = To & {
    [key in Key]: typeof MixtrackPlatinumFX;
  };
  type InputsRecord = Record<string, midi.InputCallback>;

  interface Channel extends components.Deck {
    id: 1 | 2 | 3 | 4;
    /**
     * If this channel is in use by the controller
     */
    tracked: boolean;
  }

  interface EffectUnit extends components.ComponentContainer {
    id: 1 | 2 | 3 | 4;
    effects: [Effect, Effect, Effect];
    enabled: boolean;
    dryWetKnob: components.Pot;
  }

  interface Effect extends components.ComponentContainer {
    id: 1 | 2 | 3;
    selected: boolean;

    switch(this: this, active: boolean): void;
    led(this: this, light: boolean | number): void;

    inputs: InputsRecord;
  }

  interface UnitToggler extends components.Component {
    id: "left" | "right";
    units: EffectUnit[];
    channels: Channel[];
    /**
     * If set to `true`, then it will activate the effect units on all channels even if it is not tracked by the controller
     * @default false
     */
    syncChannels: boolean;

    switch(this: this, active: boolean): void;
    inputs: InputsRecord;
  }
}
