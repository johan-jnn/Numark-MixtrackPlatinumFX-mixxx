namespace mpfx {
  class Deck extends components.ComponentContainer {
    constructor(id: typeof this.id, channels: Channel[]);

    // Left or right
    readonly id: 1 | 2;

    /**
     * The channel this deck is currently tracking
     */
    channel: Channel;
    _trackable: Channel[];

    play: components.PlayButton;
    cue: components.CueButton;
    sync: components.SyncButton;

    /**
     * Returns the other deck
     */
    get brother(): Deck;

    /**
     * Set the new tracked channel
     */
    track(channel: Channel | Channel["id"]): Channel;
    /**
     * Tracks the next trackable channel
     */
    switch(): ReturnType<Deck["track"]>;
    /**
     * Update the deck's screen informations
     * @param only You can use this object to filter which screen part will be updated. Using filter reduces the number of sent Sysex messages.
     */
    updateScreen(only?: { [key in ScreenParts]?: boolean }): void;
  }

  /**
   * See a channel like a Mixxx's deck
   */
  class Channel extends components.Component {
    constructor(channel: typeof this.id);

    readonly id: 1 | 2 | 3 | 4;
    bytes: {
      id: number;
    };

    /**
     * The deck that actually tracks this channel (if undefined, then the channel is not tracked by a physical deck)
     */
    trackedBy?: Deck;
    /**
     * Get the loaded track informations of this channel.
     * If the channel does not have track, it returns `null`
     */
    getLoadedTrackInfo(): null | trackStateInformations;
  }

  class Effect extends components.Button {
    constructor(unit: EffectUnit, effect: typeof this.id);

    readonly id: 1 | 2 | 3;
    get isSelected(): boolean;
    get isFocused(): boolean;

    select(): void;
    unselect(): void;
    focus(): void;
    unfocus(): void;

    led(power: boolean | number): void;
  }

  class EffectUnit extends components.EffectUnit {
    constructor(unit: typeof this.id);

    readonly id: 1 | 2 | 3 | 4;
    [key: Effect["id"]]: Effect;
    get effects(): Effect[];

    get isSending(): boolean;
    get focusedEffect(): Effect | null;

    clearSelection(this: this): void;
    selectAll(this: this): void;

    clearFocus(this: this): void;
    focusNext(this: this): void;
    focusPrevious(this: this): void;

    send(channel: Channel): void;
    unsend(channel: Channel): void;
    isSendingTo(channel: Channel): boolean;
  }

  class EffectPad extends components.ComponentContainer {
    constructor(units: EffectUnit[]);

    [key: EffectUnit["id"]]: EffectUnit;
    get units(): EffectUnit[];
  }

  class EffectPadSender extends components.Button {
    constructor(sender: typeof this.id, pad: EffectPad, channels: Channel[]);

    // left or right
    readonly id: 1 | 2;
    get isSending(): boolean;

    readonly pad: EffectPad;
    readonly channels: Channel[];
  }

  class EffectMixer extends components.ComponentContainer {
    constructor(pad: EffectPad, senders: EffectPadSender[]);

    readonly pad: EffectPad;
    readonly senders: ContainerOf<EffectPadSender>;
    beats: components.Pot;
  }

  class Browser extends components.ComponentContainer {
    constructor();

    knob: components.Encoder;
    selector: components.Button;
  }

  interface GlobalComponentContainer extends components.ComponentContainer {
    channels: ContainerOf<Channel>;
    decks: ContainerOf<Deck>;
    effects: EffectMixer;
    browser: Browser;
  }
}
