/**
 * Type declarations for the Components JS library for Mixxx.
 * See midi-components-0.0.js (Copyright (C) 2017 Be <be.0@gmx.com>, GPL-2.0-or-later)
 *
 * The library exposes a single global, `components`, containing the classes
 * declared below. Every constructor accepts a plain object whose properties
 * are copied onto the new instance with `Object.assign`, so it is common
 * (and supported) to pass overrides for prototype methods such as `input`,
 * `output`, `connect`, `shift` and `unshift` directly in that object.
 */

/** A `[status, control]` MIDI address, as used by {@link components.Component.send}. */
type MidiAddress = [status: number, control: number];

declare namespace components {
    /**
     * Options object accepted by {@link Component} and its subclasses.
     * Known members of `T` are offered for autocompletion, but any other
     * property (including method overrides) may also be supplied.
     */
    type ComponentOptions<T extends Component = Component> = Partial<T> & { [key: string]: any };

    /**
     * Base class of every control-surface element (buttons, pots, encoders, ...).
     * You should not need to instantiate this directly other than for simple
     * elements that only need input/output scaling (e.g. VU meters).
     */
    class Component {
        /**
         * @param options Either a `[status, control]` MIDI pair, or an options
         *                object whose properties are copied onto the instance.
         *                If `options.key` is a string, it is used for both
         *                `inKey` and `outKey`.
         */
        constructor(options?: ComponentOptions | MidiAddress);

        /** Mixxx group this Component operates on, e.g. `"[Channel1]"`. */
        group?: MixxxControls.Group;
        /** `[status, control]` MIDI address used by {@link send}. */
        midi?: MidiAddress;
        /** Control key used by the `in*` helper methods. */
        inKey?: string;
        /** Control key used by the `out*` helper methods. */
        outKey?: string;
        /** Set to `true` while the owning {@link ComponentContainer} is shifted. */
        isShifted: boolean;
        /** {@link ScriptConnection}s created by {@link connect}; cleared by {@link disconnect}. */
        connections: (ScriptConnection | undefined)[];

        /** Maximum raw input/output value. `127` for MIDI; may differ for HID. */
        max: number;
        /** Whether the constructor should call {@link connect} (and possibly {@link trigger}) automatically. */
        outConnect: boolean;
        /** Whether the constructor should call {@link trigger} right after connecting. */
        outTrigger: boolean;

        /** Offset added to the MIDI address/channel when sending a shifted value. */
        shiftOffset: number;
        /** Whether {@link send} should also send a shifted copy of the message. */
        sendShifted: boolean;
        /** If `true`, the shifted copy is sent on `midi[0] + shiftOffset`. */
        shiftChannel: boolean;
        /** If `true`, the shifted copy is sent on `midi[1] + shiftOffset`. */
        shiftControl: boolean;

        /** Called once by the constructor, before `connect()`. Typically sets the unshifted `inKey`/behavior. */
        unshift?(): void;
        /** Called by {@link ComponentContainer.shift}. Typically sets the shifted `inKey`/behavior. */
        shift?(): void;
        /** Called by {@link ComponentContainer.shutdown}. */
        shutdown?(): void;

        /** Converts a raw incoming value (`0..max`) to a normalized parameter (`0..1`). */
        inValueScale(value: number): number;
        /** MIDI input handler, bound to this Component in the XML mapping. */
        input(channel: number, control: number, value: number, status: number, group: string): void;
        /** Converts a normalized parameter (`0..1`) to a raw outgoing value (`0..max`). */
        outValueScale(value: number): number;
        /** Called whenever the connected Mixxx control changes; sends the scaled value. */
        output(value: number, group: string, control: string): void;

        inGetParameter(): number;
        inSetParameter(value: number): void;
        inGetValue(): number;
        inSetValue(value: number): void;
        inToggle(): void;

        outGetParameter(): number;
        outSetParameter(value: number): void;
        outGetValue(): number;
        outSetValue(value: number): void;
        outToggle(): void;

        /**
         * Creates `connections[0]`, linking `group`/`outKey` to {@link output}.
         * Override to connect multiple Mixxx controls to a single Component
         * (push extra entries onto `this.connections` so {@link disconnect}
         * and {@link trigger} still work automatically).
         */
        connect(): void;
        /** Disconnects every entry in {@link connections}. */
        disconnect(): void;
        /** Triggers every entry in {@link connections}. */
        trigger(): void;
        /** Sends a MIDI short message using {@link midi}, honoring the shift* options. */
        send(value: number): void;
    }

    /** A button-like Component with press/toggle/power-window behavior. */
    class Button extends Component {
        constructor(options?: ComponentOptions<Button> | MidiAddress);

        /** Available values for {@link type}. */
        readonly types: Readonly<{ push: 0; toggle: 1; powerWindow: 2 }>;
        /** Behavior of this Button; one of {@link types}. Defaults to `types.push`. */
        type?: number;
        /** Value sent for the "on"/lit state. */
        on: number;
        /** Value sent for the "off"/unlit state. */
        off: number;
        /**
         * Time in milliseconds distinguishing a short press from a long press,
         * used by the `powerWindow` type. Referencing this (as `this.longPressTimeout`)
         * in custom Buttons keeps timeouts uniform across a mapping.
         */
        longPressTimeout: number;
        /** For `powerWindow`, whether to call {@link Component.trigger} on release if not long-pressed. */
        triggerOnRelease: boolean;
        /** For `powerWindow`, whether the current press has exceeded {@link longPressTimeout}. */
        isLongPressed: boolean;
        /** Timer ID for the pending long-press callback, or `0` (`NO_TIMER`) when none is pending. */
        longPressTimer: number;

        /** Returns whether a MIDI value represents the button being pressed (i.e. `value > 0`). */
        isPress(channel: number, control: number, value: number, status: number): boolean;
    }

    /** Play/pause button; toggles `play`, momentarily reverses on shift. */
    class PlayButton extends Button {
        constructor(options?: ComponentOptions<PlayButton> | MidiAddress);
    }

    /** Cue button; supports an alternate shifted behavior via {@link reverseRollOnShift}. */
    class CueButton extends Button {
        constructor(options?: ComponentOptions<CueButton> | MidiAddress);

        /** When `true`, shift maps this button to `reverseroll` instead of `start_stop`. */
        reverseRollOnShift?: boolean;
    }

    /** Sync button; short press syncs once, holding enables sync lock. Shift toggles quantize. */
    class SyncButton extends Button {
        constructor(options?: ComponentOptions<SyncButton> | MidiAddress);
    }

    /** Button that exits a loop, or (re)creates one at the last-used size. */
    class LoopToggleButton extends Button {
        constructor(options?: ComponentOptions<LoopToggleButton> | MidiAddress);
    }

    /**
     * Hotcue button. `options.number` is required and selects which hotcue
     * (`hotcue_<number>_*`) this button controls.
     */
    class HotcueButton extends Button {
        constructor(
            options: ComponentOptions<HotcueButton> & { number: number } & (MidiAddress | {}),
        );

        /** Hotcue number this button controls. */
        number: number;
        /** Control key for the hotcue color, set automatically when `colorMapper` or `sendRGB` is provided. */
        colorKey?: string;
        /** Maps arbitrary RGB colors to the controller's fixed color palette. */
        colorMapper?: ColorMapper;

        output(value: number): void;
        /** Sends `colorCode` to the controller, via {@link colorMapper} or {@link sendRGB}. */
        outputColor(colorCode: number): void;
        /**
         * Sends an RGB color to the controller. Must be overridden in the
         * mapping for controllers with arbitrary RGB hotcue LEDs (i.e. when
         * no {@link colorMapper} is provided).
         */
        sendRGB(colorObject: ColorRGB): void;
    }

    /**
     * Sampler slot button. `options.number` is required and selects which
     * sampler (`[SamplerN]`) this button controls.
     */
    class SamplerButton extends Button {
        constructor(options: ComponentOptions<SamplerButton> & { number: number } & (MidiAddress | {}));

        /** Sampler number this button controls. */
        number: number;
        /** Sampler group, set automatically to `"[Sampler<number>]"`. */
        group: MixxxControls.Group;
        /** When `true`, `cue_gotoandplay` playback volume follows MIDI velocity. */
        volumeByVelocity?: boolean;
        /** Value sent when a track is loaded but not playing. Falls back to {@link Button.on} if unset. */
        loaded?: number;
        /** Value sent while the sampler is playing. Falls back to {@link loaded} if unset. */
        playing?: number;
        /** Value sent while the sampler is playing a looped sample. Falls back to {@link playing} if unset. */
        looping?: number;
        /** Value sent when no track is loaded. Falls back to {@link Button.off} if unset. */
        empty?: number;
    }

    /**
     * Toggles whether a channel is assigned to an effect unit.
     * `options.group` is the channel group (e.g. `"[Channel1]"`) to assign,
     * and `options.effectUnit` selects the target `[EffectRack1_EffectUnitN]`.
     */
    class EffectAssignmentButton extends Button {
        constructor(options: ComponentOptions<EffectAssignmentButton> & { group: string; effectUnit: number });
    }

    /** A knob, fader or other continuous input Component. */
    class Pot extends Component {
        constructor(options?: ComponentOptions<Pot> | MidiAddress);

        /** Whether soft-takeover is engaged for `inKey` once the first value has been received. */
        softTakeover: boolean;
        /** Whether {@link input} inverts the incoming value (`1 - value`). */
        invert?: boolean;
        /** Whether this Pot is a relative (jog-wheel style) encoder, disabling soft-takeover semantics. */
        relative?: boolean;
        /** Most-significant byte received so far, for 14-bit MIDI input. `undefined` until the first `inputMSB`. */
        MSB?: number;
        /** Set once the first value has been received; used to defer enabling soft-takeover. */
        firstValueReceived: boolean;

        /** Input handler for the least-significant byte of a 14-bit MIDI control. */
        inputMSB(channel: number, control: number, value: number, status: number, group: string): void;
        /** Input handler for the most-significant byte of a 14-bit MIDI control. */
        inputLSB(channel: number, control: number, value: number, status: number, group: string): void;
    }

    /**
     * Marker subclass of {@link Component} with no behavior of its own, so
     * `instanceof components.Encoder` can be used to distinguish relative
     * encoders from other Components.
     */
    class Encoder extends Component {
        constructor(options?: ComponentOptions<Encoder> | MidiAddress);
    }

    /**
     * A named group of Components (and/or nested ComponentContainers),
     * assigned as arbitrary own properties. Mapping code typically attaches
     * Components/containers as extra properties on an instance, e.g.
     * `this.pads[i] = new components.Button({...})`.
     */
    class ComponentContainer {
        constructor(initialLayer?: object);

        /** Set to `true` for the whole (recursive) tree by {@link shift}, `false` by {@link unshift}. */
        isShifted: boolean;

        /**
         * Calls `operation` for every {@link Component} that is a direct (or,
         * if `recursive` is not `false`, indirect) own property of this
         * container, including Components inside arrays.
         */
        forEachComponent(operation: (this: this, component: Component) => void, recursive?: boolean): void;
        /**
         * Calls `operation` for every nested {@link ComponentContainer} that
         * is a direct (or, if `recursive` is not `false`, indirect) own
         * property of this container, including containers inside arrays.
         */
        forEachComponentContainer(operation: (this: this, container: ComponentContainer) => void, recursive?: boolean): void;
        /** Disconnects, optionally mutates via `operation`, then reconnects and triggers every Component. */
        reconnectComponents(operation?: (this: this, component: Component) => void, recursive?: boolean): void;

        /** Calls `shift()` on every direct child Component and ComponentContainer, recursively. */
        shift(): void;
        /** Calls `unshift()` on every direct child Component and ComponentContainer, recursively. */
        unshift(): void;
        /**
         * Merges `newLayer` onto this container, disconnecting affected
         * Components beforehand and reconnecting/triggering them afterwards
         * unless `reconnectComponents` is `false`.
         */
        applyLayer(newLayer: object, reconnectComponents?: boolean): void;
        /** Calls `shutdown()` on every Component in this container that defines one. */
        shutdown(): void;

        [propertyName: string]: any;
    }

    /**
     * A group of Components tied to one of several interchangeable deck
     * numbers (e.g. for a controller with fewer physical decks than Mixxx
     * decks). Use {@link setCurrentDeck} or {@link toggle} to switch which
     * deck the contained Components control.
     */
    class Deck extends ComponentContainer {
        /** @param deckNumbers One deck number, or the list of deck numbers this Deck cycles through. */
        constructor(deckNumbers: number | number[]);

        /** Deck numbers this instance cycles through. */
        deckNumbers: number[];
        /** Mixxx group currently assigned to the contained Components, e.g. `"[Channel1]"`. */
        currentDeck: string;

        /** Reassigns every contained Component's `group` to `newGroup` and reconnects them. */
        setCurrentDeck(newGroup: string): void;
        /** Cycles {@link currentDeck} through {@link deckNumbers}. */
        toggle(): void;
    }

    /** Options accepted by {@link JogWheelBasic}, beyond the common Component options. */
    interface JogWheelBasicOptions {
        /** Deck number to control. Takes priority over `group` if both are set. */
        deck?: number;
        /** Deck group to control, e.g. `"[Channel1]"`. Ignored if `deck` is set. */
        group?: MixxxControls.Group;
        /** Wheel resolution in ticks per revolution, required for scratching. */
        wheelResolution: number;
        /** Alpha coefficient of the scratch filter (start with `1/8` and tune from there). */
        alpha: number;
        /** Beta coefficient of the scratch filter. Defaults to `alpha / 32`. */
        beta?: number;
        /** Speed of the imaginary record at 0% pitch, in RPM. Defaults to `33 + 1/3`. */
        rpm?: number;
    }

    /** A jog wheel, handling both scratching (touch) and relative pitch bend (wheel turn). */
    class JogWheelBasic extends Component {
        constructor(options: ComponentOptions<JogWheelBasic> & JogWheelBasicOptions);

        /** Deck number currently controlled by this jog wheel. */
        deck: number;
        /** Mixxx group currently controlled by this jog wheel, derived from {@link deck}. */
        group: MixxxControls.Group;
        wheelResolution: number;
        alpha: number;
        beta: number;
        rpm: number;
        /** Whether touching the wheel engages scratching. Disabling mid-scratch stops it immediately. */
        vinylMode: boolean;

        /** Returns whether a MIDI value represents the wheel/touch surface being pressed (i.e. `value > 0`). */
        isPress(channel: number, control: number, value: number, status: number): boolean;
        /** Input handler for wheel rotation; must be bound explicitly in the XML mapping. */
        inputWheel(channel: number, control: number, value: number, status: number, group: string): void;
        /** Input handler for the touch sensor; must be bound explicitly in the XML mapping. */
        inputTouch(channel: number, control: number, value: number, status: number, group: string): void;
        /** Called when {@link deck} changes; override to reset any per-deck state. */
        reset(): void;
    }

    /** LED colors used by an {@link EffectUnit}'s focus-related buttons. */
    interface EffectUnitColors {
        unfocused: string | number;
        focused: string | number;
        focusChooseMode: string | number;
    }

    /**
     * A Pot bound to one of an EffectUnit's three effect-parameter knobs,
     * with an extra `number` (1-3) identifying the slot.
     */
    interface EffectUnitKnob extends Pot {
        number: number;
        onFocusChange(value: number, group: string, control: string): void;
    }

    /**
     * A Button bound to one of an EffectUnit's three effect-enable slots,
     * with an extra `number` (1-3) identifying the slot and support for the
     * long-press "focus choose mode".
     */
    interface EffectUnitEnableButton extends Button {
        number: number;
        color?: string | number;
        onFocusChange(value: number, group: string, control: string): void;
        /** Restores normal (non-focus-choosing) enable/disable behavior. */
        stopEffectFocusChooseMode(): void;
        /** Switches this button into "select which effect to focus" behavior. */
        startEffectFocusChooseMode(): void;
    }

    /**
     * A full effect unit: dry/wet knob, per-channel enable buttons, three
     * effect-parameter knobs and enable buttons, and an effect-focus button.
     * `unitNumbers` may list several `[EffectRack1_EffectUnitN]` numbers to
     * cycle through with {@link toggle}, mirroring {@link Deck}.
     */
    class EffectUnit extends ComponentContainer {
        /**
         * @param unitNumbers One unit number, or the list of unit numbers this EffectUnit cycles through.
         * @param allowFocusWhenParametersHidden If `true`, effect focus is shown even while parameters are hidden in the skin.
         * @param colors LED colors for the focus-related buttons.
         */
        constructor(unitNumbers: number | number[], allowFocusWhenParametersHidden?: boolean, colors?: EffectUnitColors);

        /** Unit numbers this instance cycles through. */
        unitNumbers: number[];
        /** Unit number currently assigned to the contained Components. */
        currentUnitNumber: number;
        /** Mixxx group currently assigned to the contained Components, e.g. `"[EffectRack1_EffectUnit1]"`. */
        group: string;
        /** Whether the long-press "select effect to focus" mode is currently active. */
        focusChooseModeActive: boolean;
        /** Set to `true` once {@link init} has run once, gating initial soft-takeover setup. */
        hasInitialized: boolean;
        /** Effect number that was focused before parameters were last hidden. */
        previouslyFocusedEffect?: number;

        dryWetKnob: Pot;
        enableOnChannelButtons: ComponentContainer & {
            /** Adds a toggle button assigning `"[<channel>]"` to this effect unit. */
            addButton(channel: string): void;
        };
        knobs: ComponentContainer & Record<1 | 2 | 3, EffectUnitKnob>;
        enableButtons: ComponentContainer & Record<1 | 2 | 3, EffectUnitEnableButton>;
        effectFocusButton: Button;

        /** Constructor for this unit's per-slot effect-parameter knobs; see {@link knobs}. */
        EffectUnitKnob: new (number: number) => EffectUnitKnob;
        /** Constructor for this unit's per-slot effect-enable buttons; see {@link enableButtons}. */
        EffectEnableButton: new (number: number) => EffectUnitEnableButton;

        /** Reassigns this unit (and its contained Components) to `newNumber`. */
        setCurrentUnit(newNumber: number): void;
        /** Cycles {@link currentUnitNumber} through {@link unitNumbers}. */
        toggle(): void;
        /**
         * Finishes setting up connections that depend on the whole EffectUnit
         * (and, typically, other EffectUnits) already existing. Must be
         * called once after all EffectUnits have been constructed.
         */
        init(): void;
    }
}
