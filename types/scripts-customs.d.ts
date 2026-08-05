namespace mpfx {
  type Binded<To, Key = "mpfx"> = To & {
    [key in Key]: typeof MixtrackPlatinumFX;
  };
  type InputsRecord = Record<string, midi.InputCallback>;

  /**
   * Controller's physical deck
   */
  interface Deck extends components.Deck {
    id: "left" | "right";
    tracks?: Channel;
    get group(): string | undefined;

    track(this: this, channel: Channel, force = false): void;
    untrack(this: this): void;
  }

  /**
   * See a channel like a Mixxx's deck
   */
  interface Channel extends components.ComponentContainer {
    id: 1 | 2 | 3 | 4;
    /**
     * The deck that actually tracks this channel (if undefined, then the channel is not tracked by a physical deck)
     */
    trackedBy?: Deck;
  }

  interface EffectUnit extends components.ComponentContainer {
    id: 1 | 2 | 3 | 4;
    effects: Record<Effect["id"], Effect>;
    enabled: boolean;
    dryWetKnob: components.Pot;

    clearSelection(this: this): void;
    selectAll(this: this): void;
  }

  interface Effect extends components.ComponentContainer {
    id: 1 | 2 | 3;
    selected: boolean;
    /**
     * True only if in "longPressing" mode or if the leds is pressed while already selected
     */
    toggleing: boolean;

    switch(this: this, active: boolean): void;
    led(this: this, light: boolean | number): void;

    inputs: InputsRecord;
  }

  interface UnitToggler extends components.Component {
    id: "left" | "right";
    units: EffectUnit[];
    channels: Channel[];

    /**
     * 0 -> disabled
     * 1 -> turn up
     * 2 -> turn down
     */
    state: 0 | 1 | 2;
    /**
     * If set to `true`, then it will activate the effect units on all channels even if it is not tracked by the controller
     * @default false
     */
    syncChannels: boolean;

    switch(this: this, active: boolean, state?: this["state"]): void;
    inputs: InputsRecord;
  }

  interface GlobalComponentContainer extends components.Component {
    effectUnits: components.ComponentContainer &
      Record<EffectUnit["id"], EffectUnit>;
    unitTogglers: components.ComponentContainer &
      Record<UnitToggler["id"], UnitToggler>;

    channels: components.ComponentContainer & Record<Channel["id"], Channel>;
    decks: components.ComponentContainer & Record<Deck["id"], Deck>;
  }
}
