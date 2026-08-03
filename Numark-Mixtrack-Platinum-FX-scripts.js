var MixtrackPlatinumFX = {
  /**
   * Controller's behaviors configuration
   */
  CONFIG: {
    FX: {
      // set this to "super" to make it require to use the super key
      toggleable: true,
    },
    waveforms: {
      sync: true,
      zoomByShiftBrowse: true,
    },
    jog: {
      scratch: {
        sensitivity: 1024,
        alpha: 1,
        beta: 1 / 32,
      },
      seek: {
        sensitivity: 1e3,
      },
    },
    pitch: {
      sensitivity: 10,
      ranges: [0.08, 0.16, 0.5],
    },
    sampler: {
      /**
       * If you use the full-layout sample (= 16 samples on the skin),
       * then set this setting to `true` to make the sampler's layout matching
       * with the controller's one.
       */
      orderByLayout: true,
    },
    leds: {
      high: 0x7f,
      low: 0x01,

      blink: {
        enable: true,
        delay: 700, //ms
      },
    },
    decks: {
      /**
       * When using the 3 or the 4th deck on the controller,
       * switch to the "4 deck mode" skin.
       */
      auto4Decks: true,
    },
    loops: {
      /**
       * Available sizes:
       * 0.03125, 0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512
       * @see https://manual.mixxx.org/2.4/en/chapters/appendix/mixxx_controls.html#control-[ChannelN]-beatloop_X_toggle
       */
      sizes: [0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16],
    },
    beatJumps: {
      /**
       * Available sizes:
       * 0.03125, 0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512
       * @see https://manual.mixxx.org/2.4/en/chapters/appendix/mixxx_controls.html#control-[ChannelN]-beatjump_X_forward
       */
      sizes: [0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8, 16],
    },
  },
  // -------------------------------------------------

  /* #region Constants */
  BYTES_VALUES: {
    true: 0x7f,
    false: 0x00,
    /**
     * @param {number} value [0; 1]
     */
    range(value) {
      return parseInt(this.true * Max.max(0, Math.min(1, value)));
    },
  },
  BYTES_MAP: {
    channels: {
      /**
       * @param {ControllerChannel} channel
       */
      selector(channel) {
        return 0x90 + channel - 1;
      },
      rate: 0x0e,
      keylock: 0x0d,
    },
    fx: {
      /**
       * @param {mpfx.EffectUnit['id']} unit
       * @param {mpfx.Effect['id']} effect
       */
      selector(unit, effect) {
        return [0x98 + (unit - 1), effect - 1 + 3 * (unit - 1)];
      },
    },
    pads: {
      modes: {
        hotcues: {
          1: 0x00,
          2: 0x02,
        },
        fadercuts: {
          1: 0x07,
          // not used by controller
          2: 0x03,
          // not used by controller
          3: 0x04,
        },
        samplers: {
          1: 0x0b,
          2: 0x0f,
        },
        autoloops: {
          1: 0x0d,
          // not used by controller
          2: 0x0e,
          // not used by controller
          3: 0x05,
        },
        // not used by controller
        beatjumps: {
          1: 0x01,
        },
        // not used by controller
        keyplays: {
          1: 0x0c,
        },
      },
    },
  },
  SYSEX_BUFFERS: {
    exitDemoLightshow: [0xf0, 0x7e, 0x00, 0x06, 0x01, 0xf7],
    status: [0xf0, 0x00, 0x20, 0x7f, 0x03, 0x01, 0xf7],
    shutdown: [0xf0, 0x00, 0x20, 0x7f, 0x02, 0xf7],

    /**
     * @param {"top" | "bottom"} pads
     */
    enableFaderCuts(pads) {
      let byte = 0x03;
      if (pads === "top") {
        byte |= 0x10;
      }

      return [0xf0, 0x00, 0x20, 0x7f, byte, 0xf7];
    },
  },
  /* #endregion */

  /* #region Components */
  /**
   * @this mpfx.Binded<mpfx.Channel>
   * @param {mpfx.Channel['id']} channel
   */
  Channel: function (channel) {
    MixtrackPlatinumFX.bindMPFX(this);
    components.Deck.call(this, channel);

    this.mpfx.debug(`Initializing Channel #${channel}`);
    this.id = channel;
    this.tracked = false;
  },
  /**
   * @this mpfx.Binded<mpfx.Effect>
   * @param {mpfx.EffectUnit} unit
   * @param {mpfx.Effect['id']} effect
   */
  Effect: function (unit, effect) {
    MixtrackPlatinumFX.bindMPFX(this);

    this.mpfx.debug(`Initializing effect #${effect} from unit #${unit.id}`);
    this.id = effect;
    this.selected = false;

    /**
     * @type {(typeof this)['switch']}
     */
    this.switch = function (active) {
      this.selected = active;

      engine.setValue(
        `[EffectRack1_EffectUnit${unit.id}_Effect${this.id}]`,
        "enabled",
        +active,
      );
      this.led(active);
    };
    /**
     * @type {(typeof this)['led']}
     */
    this.led = function (light) {
      if (typeof light === "boolean") {
        light = [this.mpfx.CONFIG.leds.low, this.mpfx.CONFIG.leds.high][+light];
      }

      midi.sendShortMsg(
        ...this.mpfx.BYTES_MAP.fx.selector(unit.id, this.id),
        light,
      );
    };
  },
  /**
   * @this mpfx.Binded<mpfx.EffectUnit>
   * @param {mpfx.EffectUnit['id']} unit
   * @param {mpfx.Channel[]} channels Active the effect unit for those channels (if there are active)
   *
   * @todo Refactor code as the switch must controller the 2 Mixxx FX unit but enables only on the given channel
   * @todo Create a component "EffectSwitch" that takes the given channels
   */
  EffectUnit: function (unit, channels) {
    MixtrackPlatinumFX.bindMPFX(this);
    components.ComponentContainer.call(this);

    this.mpfx.debug(
      `Initializing Effect Unit #${unit} (Channels : ${channels.map((c) => c.id).join(", ")})`,
    );
    this.id = unit;
    this.effects = [
      new this.mpfx.Effect(this, 1),
      new this.mpfx.Effect(this, 2),
      new this.mpfx.Effect(this, 3),
    ];

    this.enabled = false;
    this.dryWetKnob = new components.Pot({
      group: `[EffectRack1_EffectUnit${unit}]`,
    });

    // To avoid confusion, we disable the effects in the headphone & master group
    engine.setValue(
      `[EffectRack1_EffectUnit${unit}]`,
      "group_[Headphone]_enable",
      0,
    );
    engine.setValue(
      `[EffectRack1_EffectUnit${unit}]`,
      "group_[Master]_enable",
      0,
    );

    this.mpfx.events.listen("shift", () => this.shift());
    this.mpfx.events.listen("unshift", () => this.unshift());
  },
  /**
   * @this mpfx.Binded<mpfx.UnitToggler>
   * @param {mpfx.EffectUnit[]} units
   * @param {mpfx.Channel[]} channels
   */
  UnitToggler: function (units, channels) {
    MixtrackPlatinumFX.bindMPFX(this);
    components.Component.call(this);

    this.mpfx.debug(
      `Initalizing an unit switcher (controlling units ${units.map((u) => u.id)} on channels ${channels.map((c) => c.id)} channels)`,
    );
    this.units = units;
    this.channels = channels;
    this.syncChannels = false;
    this.inputs = {
      toggle: (channel, control, value, status) => {
        // The value can be either 0, 1 or 2 (for switch up/switch down)
        this.switch(value != this.mpfx.BYTES_VALUES.false);
      },
    };

    /**
     * @type {(typeof this)['switch']}
     */
    this.switch = function (active) {
      for (const channel of this.channels) {
        if (!(channel.tracked || this.syncChannels)) {
          continue;
        }

        for (const unit of this.units) {
          engine.setValue(
            `[EffectRack1_EffectUnit${unit.id}]`,
            `group_[Channel${channel.id}]_enable`,
            +active,
          );

          unit.effects.forEach((e) => e.led(e.selected && active));
        }
      }
    };
  },
  /* #endregion */

  /* #region States */
  $shifting: false,
  $blinker: {
    /**
     * @typedef {<R>(on:boolean) => R} BlinkerCallback
     */
    timer: 0,
    state: true,
    $$EVENT: "led_blink",
    enable() {
      this.timer = engine.beginTimer(
        MixtrackPlatinumFX.CONFIG.leds.blink.delay,
        () => {
          this.state = !this.state;
          MixtrackPlatinumFX.events.emit(this.$$EVENT, this.state);
        },
        false,
      );
    },
    disable() {
      if (this.timer) engine.stopTimer(this.timer);
    },
    /**
     * @param {[number, number]} led
     * @param {undefined|BlinkerCallback<boolean>} custom_callback If defined and returns `true`, then do not execute the default callback
     */
    add(led, custom_callback) {
      return this.toggled((on) => {
        if (custom_callback?.(on)) return;
        midi.sendShortMsg(
          ...led,
          on
            ? MixtrackPlatinumFX.CONFIG.leds.high
            : MixtrackPlatinumFX.CONFIG.leds.low,
        );
      });
    },
    /**
     * @param {BlinkerCallback} callback
     */
    toggled(callback) {
      return MixtrackPlatinumFX.events.listen(this.$$EVENT, callback);
    },
    /**
     * @param {number} id
     */
    remove(id, send_off = true) {
      if (send_off) {
        MixtrackPlatinumFX.events.trigger(this.$$EVENT, id, false);
      }
      MixtrackPlatinumFX.events.unlisten(this.$$EVENT, id);
    },
  },
  /* #endregion */

  /* #region Init & shutdown */
  /**
   * @type {string}
   */
  id: undefined,
  /**
   * @type {boolean}
   */
  "#debug": undefined,

  /**
   * @type {components.ComponentContainer & {
   *  [key in mpfx.Channel['id']]: mpfx.Channel
   * }}
   */
  __channels: undefined,
  __effects: {
    /**
     * @type {components.ComponentContainer & {
     *  [key in mpfx.EffectUnit['id']]: mpfx.EffectUnit
     * }}
     */
    units: undefined,
    /**
     * @type {components.ComponentContainer & {
     *  [key in mpfx.UnitToggler['id']]: mpfx.UnitToggler
     * }}
     */
    togglers: undefined,
  },
  /**
   * @type {components.ComponentContainer}
   */
  __browse: undefined,
  /**
   * @type {components.ComponentContainer}
   */
  __gain: undefined,

  init(id, debug) {
    this.id = id;
    this["#debug"] = debug;

    this.debug("Init controller with id : ", id);

    components.Button.prototype.off = this.CONFIG.leds.low;
    components.Button.prototype.on = this.CONFIG.leds.high;

    // Disable demo lightshow
    midi.sendSysexMsg(
      this.SYSEX_BUFFERS.exitDemoLightshow,
      this.SYSEX_BUFFERS.exitDemoLightshow.length,
    );
    this.debug("Lightshow exited.");

    // Enable "fader cuts" pads
    const faderCutEnabler = this.SYSEX_BUFFERS.enableFaderCuts("top");
    midi.sendSysexMsg(faderCutEnabler, faderCutEnabler.length);
    this.debug("Fader cuts pads enabled.");

    // Initialize decks
    this.__channels = new components.ComponentContainer();
    for (let channel = 1; channel <= 4; channel++) {
      this.__channels[channel] = new this.Channel(channel);
      // this.setRateRange(channel, this.CONFIG.pitch.ranges[0]);
    }

    // Initialize effects units
    this.__effects.units = new components.ComponentContainer();
    for (let unit = 1; unit <= 2; unit++) {
      this.__effects[unit] = new this.EffectUnit(unit, [
        this.__channels[1 + (unit - 1)],
        this.__channels[3 + (unit - 1)],
      ]);
    }

    // Initialize units togglers
    this.__effects.togglers = new components.ComponentContainer();
    this.__effects.togglers.left = this.UnitToggler(
      [this.__effects.units[1], this.__effects.units[2]],
      [this.__channels[1], this.__channels[3]],
    );
    this.__effects.togglers.right = this.UnitToggler(
      [this.__effects.units[1], this.__effects.units[2]],
      [this.__channels[2], this.__channels[4]],
    );

    // FX Leds blinking
    this.$blinker.toggled((on) => {
      this.__effects.forEachComponentContainer(
        /**
         * @param {mpfx.EffectUnit} unit
         */
        (unit) => {
          for (const effect of unit.effects) {
            /**
             * Light up only if selected.
             * Blink when enabled.
             */
            const light = on && !unit.disabled; //effect.active && (unit.disabled || on);
            effect.led(light);
          }
        },
      );
    });

    // Don't know what that is
    midi.sendSysexMsg(
      this.SYSEX_BUFFERS.status,
      this.SYSEX_BUFFERS.status.length,
    );

    // Triggering all the components to initialize lights
    this.__channels.forEachComponent((c) => c.trigger());
    this.__effects.forEachComponent((c) => c.trigger());

    this.$blinker.enable();

    this.debug("Controller is now ready to be use !");
  },
  shutdown() {
    this.$blinker.disable();

    // for (let i = 0; i < 4; i++) {
    //   // update spinner and position indicator
    //   midi.sendShortMsg(0xb0 | i, 0x3f, 0);
    //   midi.sendShortMsg(0xb0 | i, 0x06, 0);
    //   // keylock indicator
    //   midi.sendShortMsg(0x80 | i, 0x0d, 0x00);
    //   // turn off bpm arrows
    //   midi.sendShortMsg(0x80 | i, 0x0a, 0x00); // down arrow off
    //   midi.sendShortMsg(0x80 | i, 0x09, 0x00); // up arrow off

    //   MixtrackPlatinumFX.sendScreenRateMidi(i + 1, 0);
    //   midi.sendShortMsg(0x90 + i, 0x0e, 0);
    //   MixtrackPlatinumFX.sendScreenBpmMidi(i + 1, 0);
    //   MixtrackPlatinumFX.sendScreenTimeMidi(i + 1, 0);
    //   MixtrackPlatinumFX.sendScreenDurationMidi(i + 1, 0);
    // }

    // // switch to decks 1 and 2
    // midi.sendShortMsg(0x90, 0x08, 0x7f);
    // midi.sendShortMsg(0x91, 0x08, 0x7f);

    midi.sendSysexMsg(
      this.SYSEX_BUFFERS.shutdown,
      this.SYSEX_BUFFERS.shutdown.length,
    );
    this.debug("Controller has been shutdown.");
  },
  /* #endregion */

  /* #region Tasks */
  /**
   * @param {mpfx.Channel} channel
   * @param {number} range
   */
  setRateRange(channel, range) {
    //engine.setParameter(group, "rateRange", (range-0.01)*0.25);
    engine.setValue(`[Channel${channel}]`, "rateRange", range);
    midi.sendShortMsg(
      this.BYTES_MAP.channels.selector(channel),
      this.BYTES_MAP.channels.rate,
      range * 100,
    );
  },
  /* #endregion */

  /* #region Utils */
  /**
   * Binds in-place the Controller interface
   *
   * @typedef {object} To
   * @typedef {string} Key
   *
   * @param {To} object
   * @param {Key} key
   * @returns {mpfx.Binded<To, Key>}
   */
  bindMPFX(object, key = "mpfx") {
    return Object.assign(object, { [key]: MixtrackPlatinumFX });
  },
  events: {
    /**
     * @type {{[key: string]: {[key: number]: function}}}
     */
    "#callbacks": {},
    /**
     * @param {string} event
     * @param {function} callback
     */
    listen(event, callback) {
      if (!(event in this["#callbacks"])) {
        this["#callbacks"][event] = {};
      }

      /**
       * @type {number}
       */
      const id = Object.keys(this["#callbacks"]).reduce(
        (id, key) => Math.max(id, parseInt(key)),
        1,
      );

      this["#callbacks"][event][id] = callback;
      return id;
    },
    /**
     * @param {string} event
     * @param {number} id
     */
    unlisten(event, id) {
      if (!(event in this["#callbacks"])) return;
      if (!(id in this["#callbacks"][event])) return;
      delete this["#callbacks"][event][id];
    },
    /**
     * @param {string} event
     */
    emit(event, ...data) {
      if (!(event in this["#callbacks"])) return;
      Object.values(this["#callbacks"][event]).forEach((cb) => cb(...data));
    },
    /**
     * @param {string} event
     * @param {number|number[]} ids
     */
    trigger(event, ids, ...data) {
      if (!(event in this["#callbacks"])) return;
      if (typeof ids === "number") {
        ids = [ids];
      }

      ids.forEach((id) => {
        if (id in this["#callbacks"][event]) {
          this["#callbacks"][event][id](...data);
        }
      });
    },
  },

  /* #endregion */

  /* #region  Debug & Logs */
  /**
   * @returns {Date}
   */
  __now() {
    return Object.assign(new Date(), {
      /**
       * @this {Date}
       */
      toString() {
        const Y = this.getFullYear(),
          M = this.getMonth(),
          D = this.getDate(),
          h = this.getHours(),
          m = this.getMinutes(),
          s = this.getSeconds(),
          ms = this.getMilliseconds(),
          withLeading0 = (v, l = 2) =>
            `${"0".repeat(Math.max(0, v.toString().length - l))}${v}`;

        return `${Y}-${withLeading0(M)}-${withLeading0(D)} ${withLeading0(h)}:${withLeading0(m)}:${withLeading0(s)}.${ms}`;
      },
    });
  },
  debug(...messages) {
    if (!this["#debug"]) return;
    console.debug(`[${this.__now().toString()}] [${this.id}]`, ...messages);
  },
  /* #endregion */
};

for (const inheritance of [
  { parent: components.ComponentContainer, children: ["EffectUnit"] },
  { parent: components.Deck, children: ["Channel"] },
  { parent: components.Component, children: ["Effect"] },
]) {
  inheritance.children.forEach((key) => {
    MixtrackPlatinumFX[key].prototype = new inheritance.parent();
  });
}
