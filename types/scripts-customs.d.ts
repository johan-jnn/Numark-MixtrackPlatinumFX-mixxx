namespace mpfx {
  type Binded<To, Key = "mpfx"> = To & {
    [key in Key]: typeof MixtrackPlatinumFX;
  };

  interface Channel extends components.Deck {
    id: 1 | 2 | 3 | 4;
    active: boolean;
  }

  interface EffectUnit extends components.ComponentContainer {
    id: 1 | 2;
    effects: [Effect, Effect, Effect];
    disabled: true;
    dryWetKnob: components.Pot;
    switch(this: this, active: boolean): void;

    inputs: Record<string, midi.InputCallback>;
  }

  interface Effect extends components.ComponentContainer {
    id: 1 | 2 | 3;
    active: boolean;

    switch(this: this, active: boolean): void;
    led(this: this, light: boolean | number): void;

    inputs: Record<string, midi.InputCallback>;
  }
}
