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
       * Enable long-pressing to select/unselect a fx only while you press it.
       *
       * @type {boolean | number}
       * `false` -> disable longPressing
       * `true` -> enable longPressing (must press at least 2 leds blink long)
       * `number` -> enable longPressing (must press the given miliseconds long)
       */
      longPressing: true,
      /**
       * By default, enabling effect on a deck will enable only on channel this deck refers to.
       * Set this to `true` to also enable the effect on the deck's trackable channels that are not tracked.
       */
      sendToHidden: false,
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
    screen: {
      time: {
        /**
         * If this is `true` the time marker will be the remaining time instead of the elapsed time.
         */
        showRemainingInsteadOfElapsed: false,
      },
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
    handshake: [0xf0, 0x00, 0x20, 0x7f, 0x03, 0x01, 0xf7],
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
    this.mpfx.debug(`Initializing Channel #${channel}`);

    components.Component.call(this, {
      id: channel,
      group: `[Channel${channel}]`,
      trackedBy: undefined,
      /**@type {typeof this.getLoadedTrackInfo} */
      getLoadedTrackInfo: () => {
        const hasLoaded = engine.getValue(this.group, "track_loaded");
        if (!hasLoaded) return null;

        const duration = engine.getValue(this.group, "duration");

        return {
          elapsed: engine.getValue(this.group, "playposition") * duration,
          key: engine.getValue(this.group, "key"),
          rateRange: engine.getValue(this.group, "rateRange"),
          bpm: engine.getValue(this.group, "bpm"),
          rate: engine.getValue(this.group, "rate") * -1,

          metadata: {
            duration,
            bpm: engine.getValue(this.group, "file_bpm"),
            key: engine.getValue(this.group, "file_key"),
          },
        };
      },
    });
  },
  /**
   * @this mpfx.Binded<mpfx.Deck>
   * @param {mpfx.Deck['id']} id
   * @param {mpfx.Channel[]} channels The channels this deck can track. The first listed channel will be tracked by default
   */
  Deck: function (id, channels) {
    MixtrackPlatinumFX.bindMPFX(this);

    if (!channels?.length) {
      this.mpfx.error(
        `Unable to initalize deck #${id} : no trackable channels given.`,
      );
      return;
    }

    this.mpfx.debug(
      `Initializing Deck #${id} (tracking channels ${channels.map((c) => c.id)})`,
    );

    components.Component.call(this, {
      id,
      _trackable: channels,

      /**@type {typeof this.track} */
      track: (channel) => {
        if (typeof channel === "number") {
          channel = this.mpfx.__components.channels[channel];
        }
        if (!channels.find((c) => c.id === channel?.id)) {
          this.mpfx.warn(
            `Trying to track untrackable channel ${channel?.id} on deck #${this.id}.`,
          );
          return;
        }

        if (this.channel) {
          this.mpfx.debug(
            `Deck #${this.id} is no longer tracking channel ${this.channel.id}`,
          );
          this.channel.trackedBy = undefined;
        }
        this.channel = channel;
        this.channel.trackedBy = this;

        // Force track to the given channel.
        midi.sendShortMsg(
          this.mpfx.BYTES_MAP.channels.selector(channel.id),
          0x08,
          0x7f,
        );

        this.mpfx.debug(
          `Deck #${this.id} is now tracking channel ${channel.id}`,
        );
      },
      switch: () => {
        this.mpfx.debug(`Switching channel on deck #${this.id}...`);

        const currentIndex = this._trackable.findIndex(
          (c) => c.id === this.channel?.id,
        );
        if (currentIndex < 0) {
          return this.track(this._trackable[0]);
        }

        const nextIndex = (currentIndex + 1) % this._trackable.length;
        return this.track(this._trackable[nextIndex]);
      },
      updateScreen: () => {
        const info = this.channel.getLoadedTrackInfo();
        if (!info) {
          this.mpfx.warn(
            `Aborting deck ${this.id}'s screen update as its channel (#${this.channel.id}) does not have loaded track.`,
          );
          return;
        }

        const screenBufPrefix = [0xf0, 0x00, 0x20, 0x7f, this.channel.id];
        const time = this.mpfx.CONFIG.screen.time.showRemainingInsteadOfElapsed
          ? info.metadata.duration - info.elapsed
          : info.elapsed;

        const values = [
          this.mpfx.intToBytes(parseInt(info.bpm * 10) * 10, 6, true),
          this.mpfx.intToBytes(info.rate * 1e4, 6),
          this.mpfx.intToBytes(parseInt(info.metadata.duration * 100) * 10),
          this.mpfx.intToBytes(time * 1e3),
        ];

        for (let field = 0; field < values.length; field++) {
          midi.sendSysexMsg([
            ...screenBufPrefix,
            field + 1,
            ...values[field],
            0xf7,
          ]);
        }
      },
    });

    this.switch();
  },
  /**
   * @this mpfx.Binded<mpfx.Effect>
   * @param {mpfx.EffectUnit} unit
   * @param {mpfx.Effect['id']} effect
   */
  Effect: function (unit, effect) {
    MixtrackPlatinumFX.bindMPFX(this);
    this.mpfx.debug(`Initializing effect #${effect} from unit #${unit.id}`);

    const { longPressing } = this.mpfx.CONFIG.FX;
    const longPressTimeout =
      longPressing !== false
        ? typeof longPressing === "boolean"
          ? this.mpfx.CONFIG.leds.blink.delay * 2
          : longPressing
        : false;
    this.mpfx.debug(
      `Long press behavior is ${longPressTimeout ? `enabled (tm: ${longPressTimeout}ms)` : "disabled"}.`,
    );

    components.Button.call(this, {
      id: effect,
      group: `[EffectRack1_EffectUnit${unit.id}_Effect${effect}]`,
      key: "enabled",
      midi: this.mpfx.BYTES_MAP.fx.selector(unit.id, effect),
      type:
        longPressTimeout === false ? this.types.toggle : this.types.powerWindow,
      longPressTimeout,
      inValueScale: (value) => value > 0,
      output: (value) => {
        this.led(this.outValueScale(value));
      },

      outSetValue: (value) => {
        this.led(value);
      },
      inSetValue: (value) => {
        if (value && this.isShifted == this.mpfx.CONFIG.FX.toggleable) {
          this.mpfx.__components.effects.pad.units.forEach((u) =>
            u.clearSelection(),
          );
        }

        components.Button.prototype.inSetValue.call(this, +value);
      },
      shift: () => (this.isShifted = true),
      unshift: () => (this.isShifted = false),

      select: () => {
        this.inGetValue() || this.inSetValue(this.inValueScale(this.max));
      },
      unselect: () => {
        this.inGetValue() && this.inSetValue(0);
      },
      focus: () => {
        this.isFocused ||
          engine.setValue(unit.group, "focused_effect", this.id);
      },
      unfocus: () => {
        this.isFocused && engine.setValue(unit.group, "focused_effect", 0);
      },
      shutdown: () => {
        this.led(0);
      },

      /**@type {typeof this.led} */
      led: (on) => {
        if (typeof on === "boolean") {
          on = this[["off", "on"][+on]];
        }

        this.send(on);
      },
    });

    Object.defineProperties(this, {
      isSelected: {
        get: () => !!this.inGetValue(),
      },
      isFocused: {
        get: () => unit.focusedEffect?.id === this.id,
      },
      /**
       * The bellow is used to detect when the DJ is starting long-pressing the
       * effect. This is used to focus/unfocus the effect
       */
      isLongPressed: {
        get: () => {
          return this["#isLongPressedProxy"] ?? false;
        },
        set: (longPressed) => {
          this["#isLongPressedProxy"] = !!longPressed;
          if (!unit.isSending) {
            if (longPressed) {
              this.focus();
            } else {
              this.unfocus();
            }
          }
        },
      },
    });
  },
  /**
   * @this mpfx.Binded<mpfx.EffectUnit>
   * @param {mpfx.EffectUnit['id']} unit
   */
  EffectUnit: function (unit) {
    MixtrackPlatinumFX.bindMPFX(this);
    this.mpfx.debug(`Initializing Effect Unit #${unit}...`);
    components.EffectUnit.call(this, unit, true);

    this.id = unit;
    /**
     * ? This value is increased/decreased to know if this effect unit is sending to any channels
     * ? This avoid looping through channels
     * @type {Set<mpfx.Channel['id']>}
     */
    let sendingCache = new Set();

    /**@type {mpfx.Effect[]} */
    const effects = [
      new this.mpfx.Effect(this, 1),
      new this.mpfx.Effect(this, 2),
      new this.mpfx.Effect(this, 3),
    ];
    Object.assign(this, this.mpfx.keyBy(effects, "id"));
    Object.defineProperties(this, {
      isSending: {
        get: () => {
          return !!sendingCache.size;
        },
      },
      focusedEffect: {
        get: () => {
          /**@type {0 | mpfx.Effect['id']} */
          const focusedIndex = engine.getValue(this.group, "focused_effect");
          return focusedIndex ? this[focusedIndex] : null;
        },
      },
      effects: {
        get: () => {
          return new Array(3)
            .fill(null)
            .map((_, i) => this[i + 1])
            .filter(Boolean);
        },
      },
    });

    // To avoid confusion, we disable the effects in the headphone & master group
    engine.setValue(this.group, "group_[Headphone]_enable", 0);
    engine.setValue(this.group, "group_[Master]_enable", 0);

    /**@type {typeof this['clearSelection']} */
    this.clearSelection = function () {
      effects.forEach((e) => e.unselect());
    };
    /**@type {typeof this['selectAll']} */
    this.selectAll = function () {
      effects.forEach((e) => e.select());
    };
    /**@type {typeof this.send} */
    this.send = function (channel) {
      if (this.isSendingTo(channel)) {
        this.mpfx.warn(
          `EffectUnit #${this.id} is already sending to channel ${channel.id}.`,
        );
        return;
      }

      engine.setValue(this.group, `group_${channel.group}_enable`, 1);
      sendingCache.add(channel.id);
      this.mpfx.log(
        `EffectUnit #${this.id} is sending to channel ${channel.id}`,
      );
    };
    /**@type {typeof this.unsend} */
    this.unsend = function (channel) {
      if (!this.isSendingTo(channel)) {
        console.warn(
          `EffectUnit #${this.id} is not sending to channel ${channel.id}.`,
        );
        return;
      }

      engine.setValue(this.group, `group_${channel.group}_enable`, 0);
      sendingCache.delete(channel.id);
      this.mpfx.log(
        `EffectUnit #${this.id} is not longer sending to channel ${channel.id}`,
      );
    };
    /**@type {typeof this.isSendingTo} */
    this.isSendingTo = function (channel) {
      return sendingCache.has(channel.id);
    };

    this.clearFocus = function () {
      this.focusedEffect?.unfocus();
    };
    this.focusNext = function () {
      const focused = this.focusedEffect;
      if (focused) {
        effects.at(focused.id % 3);
      } else {
        effects[0].focus();
      }
    };
    this.focusPrevious = function () {
      const focused = this.focusedEffect;
      if (focused) {
        effects.at(focused.id - 2);
      } else {
        effects.at(-1).focus();
      }
    };

    this.mpfx.$blinker.onUpdate((short, long) => {
      effects.forEach((effect) => {
        const on =
          effect.isLongPressed || effect.isFocused
            ? short
            : effect.isSelected && (this.isSending ? long : true);
        effect.led(on);
      });
    });

    this.init();
  },
  /**
   * @this mpfx.Binded<mpfx.EffectPad>
   * @param {mpfx.EffectUnit[]} units
   */
  EffectPad: function (units) {
    MixtrackPlatinumFX.bindMPFX(this);
    components.ComponentContainer.call(this, this.mpfx.keyBy(units, "id"));
    Object.defineProperties(this, {
      units: {
        get: () => {
          return new Array(4)
            .fill(null)
            .map((_, i) => this[i + 1])
            .filter(Boolean);
        },
      },
    });
  },
  /**
   * @this {mpfx.Binded<mpfx.EffectPadSender>}
   * @param {mpfx.EffectPadSender['id']} sender
   * @param {mpfx.EffectPad} pad
   * @param {mpfx.Channel[]} channels
   */
  EffectPadSender: function (sender, pad, channels) {
    MixtrackPlatinumFX.bindMPFX(this);
    this.mpfx.debug(
      `Initializing effect pad sender #${sender} for channels ${channels.map((c) => c.id)}.`,
    );

    components.Button.call(this, {
      id: sender,
      _pad: pad,
      _channels: channels,
      type: components.Button.prototype.types.push,
      inValueScale: (value) => value && 1,
      inGetValue: () => {
        const { sendToHidden } = this.mpfx.CONFIG.FX;
        for (const channel of this._channels) {
          if (!(sendToHidden || channel.trackedBy)) continue;
          for (const unit of this._pad.units) {
            if (unit.isSendingTo(channel)) {
              return true;
            }
          }
        }

        return false;
      },
      inSetValue: (value) => {
        const { sendToHidden } = this.mpfx.CONFIG.FX;

        for (const channel of this._channels) {
          if (!(sendToHidden || channel.trackedBy)) continue;
          for (const unit of this._pad.units) {
            if (value) {
              unit.send(channel);
            } else {
              unit.unsend(channel);
            }
          }
        }
      },

      connect: () => {
        components.Button.prototype.connect.call(this);

        // Bellow, we refresh the unit-sent boolean if
        // for exemple the user manually clicks on a "send to channel" button
        for (const channel of this._channels) {
          for (const unit of this._pad.units) {
            const con = engine.makeConnection(
              unit.group,
              `group_${channel.group}_enable`,
              (value) => {
                if (value != unit.isSendingTo(channel)) {
                  value ? unit.send(channel) : unit.unsend(channel);
                }
              },
            );

            if (!con) {
              this.mpfx.error(
                `Unable to connect unit #${unit.id} and channel #${channel.id} to Mixxx.`,
              );
              continue;
            }

            this.connections.push(con);
          }
        }
      },
    });

    this.connect();
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
    // const faderCutEnabler = this.SYSEX_BUFFERS.enableFaderCuts("top");
    // midi.sendSysexMsg(faderCutEnabler, faderCutEnabler.length);
    // this.debug("Fader cuts pads enabled.");

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
    decks[1] = new this.Deck(1, [channels[1], channels[3]]);
    decks[2] = new this.Deck(2, [channels[2], channels[4]]);

    /* #region Effect Mixer */
    /**@type {typeof this.__components.effects} */
    const effects = new components.ComponentContainer();

    /**@type {typeof effects.pad} */
    const pad = new this.EffectPad([
      new this.EffectUnit(1),
      new this.EffectUnit(2),
    ]);

    /**@type {typeof effects.senders} */
    const senders = new components.ComponentContainer();
    senders[1] = new this.EffectPadSender(1, pad, [channels[1], channels[3]]);
    senders[2] = new this.EffectPadSender(2, pad, [channels[2], channels[4]]);

    // todo -> Tap and Beats

    Object.assign(effects, {
      pad,
      senders,
    });
    /* #endregion */

    Object.assign(this.__components, {
      decks,
      channels,
      effects,
    });
    this.debug("All components has been registered and initialized.");

    // Don't know what that is
    midi.sendSysexMsg(
      this.SYSEX_BUFFERS.handshake,
      this.SYSEX_BUFFERS.handshake.length,
    );

    // this.$blinker.enable();

    // Automaticly track channel 1 and 2 to be sure the script and controller are synced
    for (let i = 1; i <= 2; i++) {
      this.__components.decks[i].track(this.__components.channels[i]);
      this.__components.decks[i].updateScreen();
    }

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
    this.debug("DJ is shifting.");
  },
  unshift() {
    this.$shifting = false;
    this.__components.unshift();
    this.debug("DJ is no longer shifting.");
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
  /**
   * Encodes an integer to an array of byte
   * @param {number} int The number to encode (this number will be passing in the parseInt function to ensure it's an integer)
   * @param {number} [bytes=8] The length of the encoded bytes (default to 8).
   * @param {boolean} [skipSignMarker=false] If `true`, the sign marker will not be added. If `false` (default), the sign marker will replace the first byte.
   */
  intToBytes(int, bytes = 8, skipSignMarker = false) {
    // Ensure the given int is not floating
    int = parseInt(int);

    const buffer = [];
    for (let shift = 0; shift < bytes * 4; shift += 4) {
      buffer.unshift((int >> shift) & 0xf);
    }
    if (!skipSignMarker) {
      buffer[0] = 0x07 + +(int >= 0);
    }

    return buffer;
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
  {
    parent: components.Component,
    children: ["Channel", "Deck"],
  },
  {
    parent: components.Button,
    children: ["Effect", "EffectPadSender"],
  },
  {
    parent: components.EffectUnit,
    children: ["EffectUnit"],
  },
  {
    parent: components.ComponentContainer,
    children: ["EffectPad"],
  },
]) {
  inheritance.children.forEach((key) => {
    MixtrackPlatinumFX[key].prototype = new inheritance.parent();
  });
}
