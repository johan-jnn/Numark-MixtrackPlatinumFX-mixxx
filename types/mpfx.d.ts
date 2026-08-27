namespace mpfx {
  type Binded<To, Key = "mpfx"> = To & {
    [key in Key]: typeof MixtrackPlatinumFX;
  };
  type InputsRecord = Record<string, midi.InputCallback>;
  type ContainerOf<Type, IdKey = "id"> = components.ComponentContainer &
    Record<Type[IdKey], Type>;

  type ScreenParts =
    | "bpm"
    | "bpm_arrows"
    | "time"
    | "rate"
    | "rateRange"
    | "keylock";

  interface trackStateInformations {
    metadata: {
      bpm: number;
      duration: number;
      key: number;
    };
    rate: number;
    rateRange: number;
    elapsed: number;
    position: number;
    key: number;
    key_locked: boolean;
    bpm: number;
  }

  interface Deck extends components.ComponentContainer {
    // Left or right
    id: 1 | 2;

    /**
     * The channel this deck is currently tracking
     */
    channel: Channel;
    _trackable: Channel[];

    play: components.PlayButton;
    cue: components.CueButton;
    sync: components.SyncButton;

    switchDeckInput: midi.InputCallback;

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
  interface Channel extends components.Component {
    id: 1 | 2 | 3 | 4;
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

  interface Effect extends components.Button {
    id: 1 | 2 | 3;
    get isSelected(): boolean;
    get isFocused(): boolean;

    select(): void;
    unselect(): void;
    focus(): void;
    unfocus(): void;

    led(power: boolean | number): void;
  }

  interface EffectUnit extends components.EffectUnit {
    id: 1 | 2 | 3 | 4;
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

  interface EffectPad extends components.ComponentContainer {
    [key: EffectUnit["id"]]: EffectUnit;
    get units(): EffectUnit[];
  }

  interface EffectPadSender extends components.Button {
    // left or right
    id: 1 | 2;
    get isSending(): boolean;

    _pad: EffectPad;
    _channels: Channel[];
  }

  interface EffectMixer extends components.ComponentContainer {
    pad: EffectPad;
    senders: ContainerOf<EffectPadSender>;
    beats: components.Pot;
    tap: components.Button;
  }

  interface GlobalComponentContainer extends components.Component {
    channels: ContainerOf<Channel>;
    decks: ContainerOf<Deck>;
    effects: EffectMixer;
  }
}
