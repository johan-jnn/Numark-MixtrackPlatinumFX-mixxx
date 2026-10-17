namespace mpfx {
  type SectionName = string; //keyof typeof MixtrackPlatinumFX.CONFIG.pads.sections;
  type SectionMode = "primary" | "secondary" | "alt";

  class ChannelPads extends components.ComponentContainer {
    constructor(channel: typeof this.channel);

    readonly channel: Channel;
    [key: PadSection["name"]]: PadSection;
    get sections(): PadSection[];

    active: PadSection;

    /**
     * Select the given pad section as the active one
     */
    select(section: SectionName | PadSection): void;
  }
  class PadSection extends components.ComponentContainer {
    constructor(
      name: typeof this.name,
      channel: typeof this.channel,
      alt: typeof this.alt,

      selectButtonStatus?: number,
    );
    readonly name: SectionName;
    readonly channel: Channel;
    readonly alt?: PadSection;

    inputs: {
      select?: components.Button & { status: number };
    };
    get isVirtual(): boolean;

    mode: SectionMode;

    [key: PadButton["id"]]: PadButton;
    get pads(): PadButton[];
  }

  class PadButton extends components.Button {
    constructor(id: typeof this.id, section: typeof this.section);
    readonly id: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    readonly section: PadSection;
  }

  class Wheel extends components.JogWheelBasic {
    constructor(channel: typeof this.channel);
    readonly channel: Channel;

    inputs: {
      switchMode: components.Button;
    };
  }

  /**
   * See a channel like a Mixxx's deck
   */
  class Channel extends components.Component {
    static IdleStaticTrack: Track & { _isIdle: true };

    constructor(channel: typeof this.id);
    readonly id: 1 | 2 | 3 | 4;

    bytes: {
      id: number;
      vuMeterId: number;
    };
    inputs: {
      play: components.PlayButton;
      cue: components.CueButton & { isPressed: boolean };
      sync: components.SyncButton;
      load: components.Button;
      pfl: components.Button;

      loopToggle: components.Button;
      loopHalf: components.Button;
      loopDouble: components.Button;

      pitchBendUp: components.Button;
      pitchBendDown: components.Button & { currentRangeIndex: number };
    };
    wheel: Wheel;
    pads: ChannelPads;

    /**
     * The deck that actually tracks this channel (if undefined, then the channel is not tracked by a physical deck)
     */
    trackedBy?: Deck;
    /**
     * Get the loaded track informations of this channel.
     * If the channel does not have track, it returns `null`, but if
     * allow_idle is `true`, it always returns a track (it can be idle)
     */
    track<AllowIdle extends boolean>(
      allow_idle: AllowIdle = false,
    ): AllowIdle extends true
      ? {
          /**
           * If this is `true`, then this represent an idle track
           * (= a non existant track)
           */
          readonly _isIdle: boolean;
        } & Track
      : null | Track;
  }

  class Deck extends components.ComponentContainer {
    constructor(id: typeof this.id, channels: Channel[]);

    // Left or right
    readonly id: 1 | 2;
    private trackables: Channel[];

    /**
     * The channel this deck is currently tracking
     */
    channel: Channel;

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
     * @param track By default, it uses the current tracked channel's track information. If you want, you pass a custom track to the deck's screen.
     */
    updateScreen(
      only?: { [key in ScreenParts]?: boolean },
      track?: Track,
    ): void;
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

    send(this: this, channel: Channel): void;
    unsend(this: this, channel: Channel): void;
    isSendingTo(this: this, channel: Channel): boolean;
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
