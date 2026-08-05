var MixtrackPlatinumFX = {
  /**
   * Controller's behaviors configuration
   */
  CONFIG: {
    FX: {
      /**
       * If this is `true`, then the fx are in toggle mode
       * If this is `false`, then the fx are in select mode
       *
       * toggle mode -> tap an effect to enable it, then tap it again to disable it
       * select mode -> tap an effect to enable it and deselect the other one
       *
       * Note that "shift" switches mode
       */
      toggleable: true,
      /**
       * Enable long-pressing to activate a fx only while you press it.
       *
       * `false` -> disable longPressing
       * `true` -> enable longPressing (must press at least 2 leds blink long)
       * `number` -> enable longPressing (must press the given miliseconds long)
       */
      longPressing: 600,
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
    max: 0x7f,
    true: 0x01,
    false: 0x00,
    /**
     * @param {number} value [0; 1]
     */
    range(value) {
      return parseInt(this.max * Max.max(0, Math.min(1, value)));
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
   * @this {mpfx.Binded<mpfx.Deck>}
   * @param {mpfx.Deck["id"]} id
   * @param {mpfx.Channel | undefined} tracks If you want to automaticly track a channel
   */
  Deck: function (id, tracks) {
    MixtrackPlatinumFX.bindMPFX(this);
    this.mpfx.debug(
      "Initializing",
      id,
      "deck (default channel:",
      tracks?.id,
      ")",
    );

    components.Deck.call(this, tracks?.id);
    this.id = id;
    Object.defineProperty(this, "group", {
      get: () => this.tracks && `[Channel${this.tracks.id}]`,
    });

    /**@type {typeof this.track} */
    this.track = function (channel, force = false) {
      if (this.tracks) {
        if (force) {
          this.untrack();
        } else {
          this.mpfx.warn(
            `Tried to track channel #${channel.id} but already tracking channel #${this.tracks.id}.`,
          );
        }
      }
      this.tracks = channel;
      channel.trackedBy = this;
      this.setCurrentDeck(this.group);
      this.mpfx.debug(
        `Deck #${this.id} is now tracking channel #${this.tracks.id} (group: ${this.group})`,
      );
    };
    /**@type {typeof this.untrack} */
    this.untrack = function () {
      this.mpfx.debug(
        `Deck #${this.id} will no longer track channel #${this.tracks?.id}`,
      );
      if (this.tracks) {
        this.tracks = this.tracks.trackedBy = undefined;
      }
    };

    if (tracks) {
      this.track(tracks);
    }
  },
  /**
   * @this mpfx.Binded<mpfx.Channel>
   * @param {mpfx.Channel['id']} channel
   */
  Channel: function (channel) {
    MixtrackPlatinumFX.bindMPFX(this);
    this.mpfx.debug(`Initializing Channel #${channel}`);

    this.id = channel;
    this.trackedBy = undefined;
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
    this.toggleing = false;

    let longPressingTM = 0;
    this.inputs = {
      press: () => {
        if (this.selected) {
          this.toggleing = true;
        } else {
          this.switch(true);
        }

        engine.stopTimer(longPressingTM);
        const { longPressing } = this.mpfx.CONFIG.FX;
        if (longPressing) {
          const duration =
            longPressing === "boolean"
              ? this.mpfx.CONFIG.leds.blink.delay * 2
              : longPressing;

          longPressingTM = engine.beginTimer(
            duration,
            () => {
              this.toggleing = true;
            },
            true,
          );
        }
      },
      release: () => {
        engine.stopTimer(longPressingTM);

        // user is not long-pressing the fx button
        if (this.toggleing) {
          this.toggleing = false;
          this.switch(false);
        }
      },
    };

    /**
     * @type {(typeof this)['switch']}
     */
    this.switch = function (active) {
      if (active && this.mpfx.$shifting == this.mpfx.CONFIG.FX.toggleable) {
        unit.clearSelection();
      }
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

    // Current state
    if (
      engine.getValue(
        `[EffectRack1_EffectUnit${unit.id}_Effect${this.id}]`,
        "enabled",
      )
    ) {
      this.selected = true;
    }
    this.led(this.selected);
  },
  /**
   * @this mpfx.Binded<mpfx.EffectUnit>
   * @param {mpfx.EffectUnit['id']} unit
   * @param {mpfx.Channel[]} channels Active the effect unit for those channels (if there are active)
   *
   * @todo Refactor code as the switch must controller the 2 Mixxx FX unit but enables only on the given channel
   * @todo Create a component "EffectSwitch" that takes the given channels
   */
  EffectUnit: function (unit) {
    MixtrackPlatinumFX.bindMPFX(this);
    this.mpfx.debug(`Initializing Effect Unit #${unit}...`);

    components.ComponentContainer.call(this);
    this.id = unit;
    this.effects = this.mpfx.keyBy([
      new this.mpfx.Effect(this, 1),
      new this.mpfx.Effect(this, 2),
      new this.mpfx.Effect(this, 3),
    ]);

    this.enabled = false;
    this.dryWetKnob = new components.Pot({
      group: `[EffectRack1_EffectUnit${unit}]`,
    });

    /**@type {typeof this['clearSelection']} */
    this.clearSelection = function () {
      Object.values(this.effects).forEach((e) => e.selected && e.switch(false));
    };
    /**@type {typeof this['selectAll']} */
    this.selectAll = function () {
      Object.values(this.effects).forEach((e) => e.selected || e.switch(true));
    };

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

    this.mpfx.$blinker.onUpdate((short, long) => {
      Object.values(this.effects).forEach((effect) => {
        effect.led(
          effect.selected && (effect.toggleing ? short : !this.enabled || long),
        );
      });
    });
  },
  /**
   * @this mpfx.Binded<mpfx.UnitToggler>
   * @param {mpfx.UnitToggler['id']} id
   * @param {mpfx.EffectUnit[]} units
   * @param {mpfx.Channel[]} channels
   */
  UnitToggler: function (id, units, channels) {
    MixtrackPlatinumFX.bindMPFX(this);
    this.mpfx.debug(
      `Initalizing an unit switcher (controlling units ${units.map((u) => u.id)} on channels ${channels.map((c) => c.id)})`,
    );

    components.Component.call(this);

    this.id = id;
    this.units = units;
    this.channels = channels;
    this.syncChannels = false;
    this.state = 0;

    this.inputs = {
      toggle: (channel, control, value, status) => {
        // The value can be either 0, 1 or 2 (for switch up/switch down)
        this.switch(value != this.mpfx.BYTES_VALUES.false, value);
      },
    };

    /**
     * @type {(typeof this)['switch']}
     */
    this.switch = function (active, state) {
      if (typeof state === "undefined") {
        state = +active;
      }

      this.state = state;

      for (const channel of this.channels) {
        if (!(channel.trackedBy || this.syncChannels)) {
          continue;
        }

        for (const unit of this.units) {
          this.mpfx.debug(
            `${active ? "Enabling" : "Disabling"} effect unit #${unit.id} on channel #${channel.id}`,
          );

          engine.setValue(
            `[EffectRack1_EffectUnit${unit.id}]`,
            `group_[Channel${channel.id}]_enable`,
            +active,
          );

          let enabled = active;
          if (!active) {
            // If we toggle off, we disable the effect units that are not enabled by the other toggler
            const brother =
              this.mpfx.__components.unitTogglers[
                this.id === "right" ? "left" : "right"
              ];

            if (brother.state && brother.units.find((u) => u.id == unit.id)) {
              enabled = true;
            }
          }
          unit.enabled = enabled;
        }
      }
    };
  },
  /* #endregion */

  /* #region States */
  $shifting: false,
  $blinker: {
    /**
     * @typedef {<R>(short:boolean, long:boolean) => R} BlinkerCallback
     */
    timer: 0,
    state: {
      long: false,
      short: false,
    },
    $$EVENT: "led_blink",
    enable() {
      const short_delay = Math.floor(
        MixtrackPlatinumFX.CONFIG.leds.blink.delay / 2,
      );

      this.timer = engine.beginTimer(
        short_delay,
        () => {
          this.state = {
            short: !this.state.short,
            long: this.state.short === !this.state.long,
          };
          MixtrackPlatinumFX.events.emit(
            this.$$EVENT,
            this.state.short,
            this.state.long,
          );
        },
        false,
      );
    },
    disable() {
      if (this.timer) engine.stopTimer(this.timer);
    },
    /**
     * @param {[number, number]} led The led's location byte code
     * @param {undefined|BlinkerCallback<boolean>} custom_callback If defined and returns `true`, then do not execute the default callback
     */
    forLed(led, custom_callback, fast = false) {
      return this.onUpdate((short, long) => {
        if (custom_callback?.(short, long)) return;
        midi.sendShortMsg(
          ...led,
          (fast ? long : short)
            ? MixtrackPlatinumFX.CONFIG.leds.high
            : MixtrackPlatinumFX.CONFIG.leds.low,
        );
      });
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
    /**
     * @param {BlinkerCallback} callback
     */
    onUpdate(callback) {
      return MixtrackPlatinumFX.events.listen(this.$$EVENT, callback);
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

  /**@type {mpfx.GlobalComponentContainer} */
  __components: undefined,

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

    // Registering components
    this.__components = new components.ComponentContainer();

    /**
     * @type {typeof this.__components.channels}
     */
    const channels = new components.ComponentContainer();
    for (let channel = 1; channel <= 4; channel++) {
      channels[channel] = new this.Channel(channel);
    }

    /**@type {typeof this.__components.decks} */
    const decks = new components.ComponentContainer();
    decks.left = new this.Deck("left", channels[1]);
    decks.right = new this.Deck("right", channels[2]);

    /**
     * Effect units
     * @type {typeof this.__components.effectUnits}
     */
    const effectUnits = new components.ComponentContainer();
    for (let unit = 1; unit <= 2; unit++) {
      effectUnits[unit] = new this.EffectUnit(unit);
    }

    /**
     * Effect unit togglers
     * @type {typeof this.__components.unitTogglers}
     */
    const unitTogglers = new components.ComponentContainer();
    unitTogglers.left = new this.UnitToggler(
      "left",
      [effectUnits[1], effectUnits[2]],
      [channels[1], channels[3]],
    );
    unitTogglers.right = new this.UnitToggler(
      "right",
      [effectUnits[1], effectUnits[2]],
      [channels[2], channels[4]],
    );

    Object.assign(this.__components, {
      channels,
      unitTogglers,
      effectUnits,
      decks,
    });
    this.debug("All components has been registered and initialized.");

    // Don't know what that is
    midi.sendSysexMsg(
      this.SYSEX_BUFFERS.status,
      this.SYSEX_BUFFERS.status.length,
    );

    this.$blinker.enable();

    this.debug("Controller is now ready to be use !");
  },
  shutdown() {
    this.$blinker.disable();

    midi.sendSysexMsg(
      this.SYSEX_BUFFERS.shutdown,
      this.SYSEX_BUFFERS.shutdown.length,
    );
    this.debug("Controller has been shutdown.");
  },
  /* #endregion */

  /* #region Tasks */
  shift() {
    this.$shifting = true;
    this.__components.shift();
  },
  unshift() {
    this.$shifting = false;
    this.__components.unshift();
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
  /**
   * @template {string|number} [K="id"]
   * @template {string|number} KVal
   * @template {object & {[key in K]: KVal}} O
   *
   * @param {O[]} entries
   * @param {K} key
   * @returns {Record<KVal, O>}
   */
  keyBy(entries, key = "id", overwrite = false) {
    return entries.reduce((keyed, obj) => {
      const _key = obj[key];
      if (_key in keyed && !overwrite) return obj;
      keyed[_key] = obj;
      return keyed;
    }, {});
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
      const id =
        1 +
        Object.keys(this["#callbacks"][event]).reduce(
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
     */
    emitter(event) {
      return (...args) => this.emit(event, ...args);
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
  /**
   * Print a message into the console
   * @param {boolean} [force = false] If `false` (defaults), it requires to be in debug mode to be printed
   * @param {"log" | "debug" | "warn" | "error"} [method="log"]
   * @param  {...any} messages
   */
  print(force = false, method = "log", ...messages) {
    if (!(force || this["#debug"])) return;
    console[method](`[${this.__now().toString()}] [${this.id}]`, ...messages);
  },
  log(...messages) {
    return this.print(false, "log", ...messages);
  },
  debug(...messages) {
    return this.print(false, "debug", ...messages);
  },
  warn(...messages) {
    return this.print(false, "warn", ...messages);
  },
  error(...messages) {
    return this.print(true, "error", ...messages);
  },
  /* #endregion */
};

for (const inheritance of [
  { parent: components.ComponentContainer, children: ["EffectUnit"] },
  { parent: components.Deck, children: ["Deck"] },
  { parent: components.Component, children: ["Effect", "Channel"] },
]) {
  inheritance.children.forEach((key) => {
    MixtrackPlatinumFX[key].prototype = new inheritance.parent();
  });
}
