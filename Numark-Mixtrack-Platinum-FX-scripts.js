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
      /**
       * The size of 1 jump when you turn the FX's beat parameter
       */
      beatParamShiftRange: 0.05,
    },
    browser: {
      /**
       * If the combo shift + browse should zoom in/out waveforms.
       * Note that if Mixxx's waveforms are not synced, the selected deck and left/right shift matter.
       */
      zoomWaveformsWhenShiftBrowse: true,
      /**
       * When right shifting and press on the browser's knob, toggle track's preview
       */
      rightShiftedSelectPreviewsTrack: true,
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
      /**
       * Mixmum powers of the different controller's leds.
       * The values must be in [0x00, 0x7f] ([0, 127])
       */
      power: {
        max: 0x7f,
        min: 0x01,
      },

      blinker: {
        enable: false,
        /**
         * The delay (in miliseconds) between 2 blink state.
         * Note that shorter blink will be half of this given time.
         *
         * If this value is not defined or invalid, it will sync the leds with the Mixxx's based blink delay
         */
        delay: null,
      },
    },
    decks: {
      /**
       * When using the 3 or the 4th deck on the controller,
       * switch to the "4 deck mode" skin.
       */
      syncDecksSkin: true,
      /**
       * The amount of seconds (not precise) it takes to start/stop the track
       * after you pressed the play button.
       *
       * Note that you must have at least version 2.4 of Mixxx to make this working.
       */
      playSmoothing: {
        start: 0,
        stop: 0.15,
      },
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
        /**
         * When pressing shift, does the controller inverse the above setting ("showRemainingInsteadOfElapsed") ?
         */
        inverseWhenShifting: false,
      },
      spinner: {
        /**
         * The duration (in seconds) it takes for the spinner to make a complete spin
         * @default 1.8 This is the Mixxx's based rotation speed
         */
        oneSpinDuration: 1.8,
        /**
         * If `true`, the spin will be indicated by a turned-off led instead of a turned-on led.
         */
        filledSpin: true,
      },
    },
  },

  // -------------------------------------------------

  /* #region Events */
  /**
   * @type {{[key: string]: {[key: number]: function}}}
   */
  "#eventsCB": {},
  /**
   * @param {string} event
   * @param {function} callback
   */
  listenFor(event, callback) {
    if (!(event in this["#eventsCB"])) {
      this["#eventsCB"][event] = {};
    }

    /**
     * @type {number}
     */
    const id =
      1 +
      Object.keys(this["#eventsCB"][event]).reduce(
        (id, key) => Math.max(id, parseInt(key)),
        1,
      );

    this["#eventsCB"][event][id] = callback;
    return id;
  },
  /**
   * @param {string} event
   * @param {number} id
   */
  dropListener(event, id) {
    if (!(event in this["#eventsCB"])) return;
    if (!(id in this["#eventsCB"][event])) return;
    delete this["#eventsCB"][event][id];
  },
  /**
   * @param {string} event
   */
  emit(event, ...data) {
    if (!(event in this["#eventsCB"])) return;
    Object.values(this["#eventsCB"][event]).forEach((cb) => cb(...data));
  },
  /**
   * @param {string} event
   */
  buildEmiterFor(event) {
    return (...args) => this.emit(event, ...args);
  },
  /**
   * @param {string} event
   * @param {number|number[]} ids
   */
  emitOnly(event, ids, ...data) {
    if (!(event in this["#eventsCB"])) return;
    if (typeof ids === "number") {
      ids = [ids];
    }

    ids.forEach((id) => {
      if (id in this["#eventsCB"][event]) {
        this["#eventsCB"][event][id](...data);
      }
    });
  },
  /* #endregion */

  /* #region Console outputs */
  /**
   * Print a message into the console
   * @param {boolean} [force = false] If `false` (defaults), it requires to be in debug mode to be printed
   * @param {"log" | "debug" | "warn" | "error"} [method="log"]
   * @param  {...any} messages
   */
  print(force = false, method = "log", ...messages) {
    if (!(force || this["#debug"])) return;
    let date;
    {
      const now = new Date();
      const Y = now.getFullYear(),
        M = now.getMonth(),
        D = now.getDate(),
        h = now.getHours(),
        m = now.getMinutes(),
        s = now.getSeconds(),
        ms = now.getMilliseconds(),
        withLeading0 = (v, l = 2) =>
          `${"0".repeat(Math.max(0, v.toString().length - l))}${v}`;

      date = `${Y}-${withLeading0(M)}-${withLeading0(D)} ${withLeading0(h)}:${withLeading0(m)}:${withLeading0(s)}.${ms}`;
    }

    console[method](`[${date}] [${this.id}]`, ...messages);
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

  /* #region Utils */
  /**
   * Binds the controller interface to the given object in the given key
   *
   * @template {object} To
   * @template {string} [Key="mpfx"]
   *
   * @param {To} object
   * @param {Key} key
   * @returns {mpfx.Binded<To, Key>}
   */
  bindTo(object, key = "mpfx") {
    return Object.assign(object, { [key]: MixtrackPlatinumFX });
  },
  /**
   * @template {string|number} [K="id"]
   * @template {object} O
   *
   * @param {O[]} entries
   * @param {K} key
   * @returns {Record<O[K], O>}
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
  /**
   * Converts a [0, 1] range to the given [min, max] range
   * @param {number} rate
   * @param {number} min
   * @param {number} max
   * @param {boolean} truncate If `true`, the result may contain decimal values. Default to `false`
   */
  range(rate, min = 0x00, max = 0x7f, float = false) {
    const ranged = min + (max - min) * Math.max(0, Math.min(1, rate));
    return float ? ranged : parseInt(ranged);
  },
  /* #endregion */

  /* #region Init & shutdown */
  /** @type {string} */
  id: "<UNIDENTIFIED_CONTROLLER>",
  /** @type {boolean} */
  "#debug": false,
  /**@type {mpfx.GlobalComponentContainer} */
  $components: undefined,

  init(id, debug) {
    this.id = id;
    this["#debug"] = debug;
    this.debug("Initializing controller ", id);

    components.Button.prototype.off = Math.max(0, this.CONFIG.leds.power.min);
    components.Button.prototype.on = Math.min(0x7f, this.CONFIG.leds.power.max);

    // Disable demo lightshow
    midi.sendSysexMsg([0xf0, 0x7e, 0x00, 0x06, 0x01, 0xf7]);

    // Registering components
    this.$components = new components.ComponentContainer();

    /**
     * @type {typeof this.$components.channels}
     */
    const channels = new components.ComponentContainer();
    for (let channel = 1; channel <= 4; channel++) {
      channels[channel] = new this.Channel(channel);
    }

    /**@type {typeof this.$components.decks} */
    const decks = new components.ComponentContainer();
    decks[1] = new this.Deck(1, [channels[1], channels[3]]);
    decks[2] = new this.Deck(2, [channels[2], channels[4]]);

    /* #region Effect Mixer */
    const pad = new this.EffectPad([
      new this.EffectUnit(1),
      new this.EffectUnit(2),
    ]);
    const senders = [
      new this.EffectPadSender(1, pad, [channels[1], channels[3]]),
      new this.EffectPadSender(2, pad, [channels[2], channels[4]]),
    ];

    const effects = new this.EffectMixer(pad, senders);
    /* #endregion */

    const browser = new this.Browser();

    Object.assign(this.$components, {
      decks,
      channels,
      effects,
      browser,
    });
    this.debug("All components has been registered and initialized.");

    this.CONFIG.leds.blinker.enable && this.__blinker.enable();

    // Automaticly track channel 1 and 2 to be sure the script and controller are synced
    for (let i = 1; i <= 2; i++) {
      this.$components.decks[i].track(this.$components.channels[i]);
    }

    this.debug("Controller is now ready to be use !");
  },
  shutdown() {
    this.__blinker.disable();

    midi.sendSysexMsg([0xf0, 0x00, 0x20, 0x7f, 0x02, 0xf7]);
    this.debug("Controller has been shutdown.");
  },
  /* #endregion */

  /* #region Led blinker */
  __blinker: {
    /**
     * @typedef {<R>(short:boolean, long:boolean) => R} BlinkerCallback
     *
     * @type {number | ScriptConnection | undefined}
     */
    timer: undefined,
    state: {
      long: false,
      short: false,
    },
    $$EVENT: "led_blink",
    mpfx() {
      return MixtrackPlatinumFX;
    },
    enable() {
      let { delay } = this.mpfx().CONFIG.leds.blinker;

      if (typeof delay === "number") {
        this.timer = engine.beginTimer(
          Math.floor(delay / 2),
          () => {
            this.state = {
              short: !this.state.short,
              long: this.state.short === !this.state.long,
            };

            this.mpfx().emit(this.$$EVENT, this.state.short, this.state.long);
          },
          false,
        );
      } else {
        this.timer = engine.makeConnection("[App]", "indicator_250ms", () => {
          this.state = {
            short: !!engine.getValue("[App]", "indicator_250ms"),
            long: !!engine.getValue("[App]", "indicator_500ms"),
          };

          this.mpfx().emit(this.$$EVENT, this.state.short, this.state.long);
        });
      }
    },
    disable() {
      if (typeof this.timer === "number") {
        engine.stopTimer(this.timer);
      } else if (this.timer) {
        this.timer.disconnect();
      }
    },
    /**
     * @param {number} id
     */
    remove(id, send_off = true) {
      if (send_off) {
        this.mpfx().emitOnly(this.$$EVENT, id, false);
      }
      this.mpfx().dropListener(this.$$EVENT, id);
    },
    /**
     * @param {BlinkerCallback} callback
     */
    onUpdate(callback) {
      return this.mpfx().listenFor(this.$$EVENT, callback);
    },
  },
  /* #endregion */

  /* #region Tasks */
  /**@type {midi.InputCallback} */
  shift(_, _, _, status) {
    this.$components.shift();
    this.emit("shift", !!(status & 0x1));
    this.debug("DJ is shifting.");
  },
  /**@type {midi.InputCallback} */
  unshift(_, _, _, status) {
    this.$components.unshift();
    this.emit("unshift", !!(status & 0x1));
    this.debug("DJ is no longer shifting.");
  },
  /* #endregion */

  /* #region Components */
  /**
   * @type {typeof mpfx.Channel}
   */
  Channel: createMPFXComponent(
    {
      IdleStaticTrack: {
        _hasPlayer: false,
        _isIdle: true,
        bpm: 0,
        duration: 0,
        keyNum: 0,
        state: {
          key: 0,
          rate: {
            bpm: 0,
            keyLocked: false,
            range: 0,
            rate: 0,
            value: 0,
          },
          time: {
            elapsed: 0,
            rate: 0,
            remaining: 0,
          },
        },
      },
    },
    function (parent, channel) {
      this.mpfx.debug(`Initializing Channel #${channel}`);

      parent({
        id: channel,
        group: `[Channel${channel}]`,
        bytes: {
          id: 0x90 + channel - 1,
        },
        trackedBy: undefined,
        connect: () => {
          ["play", "cue", "sync", "load"].forEach((key, shift) => {
            Object.assign(this.inputs[key], {
              midi: [this.bytes.id, shift],
              group: this.group,
            });
          });

          Object.values(this.inputs).forEach((c) => c.connect?.());
        },
        disconnect: () => {
          Object.values(this.inputs).forEach((c) => c.disconnect?.());
        },
        shift: () => {
          Object.values(this.inputs).forEach((c) => c.shift?.());
        },
        unshift: () => {
          Object.values(this.inputs).forEach((c) => c.unshift?.());
        },
        inputs: {
          play: new components.PlayButton({
            shiftOffset: 0x04,
            shiftControl: true,
            inSetValue: (value) => {
              if (!this.track()) return;
              const { play: button, cue } = this.inputs;

              let { start, stop } = this.mpfx.CONFIG.decks.playSmoothing;
              if (cue.isPressed) {
                // If cue is pressed, then we assume the user wants to keep the track playing and exit cue mode
                cue.isPressed = 0; // We abstract-release the cue
                start = stop = 0; // The start should be instant
                value = 1; // We say Mixxx to start the playing
                // We need to first pause the channel
                // to exit the cue mode without getting back to the cue point
                components.PlayButton.prototype.inSetValue.call(button, 0);
              }

              if (
                (start || stop) &&
                button.inKey === "play" &&
                "softStart" in engine &&
                "brake" in engine
              ) {
                if (value) {
                  engine.softStart(this.id, true, 10 / start);
                } else {
                  engine.brake(this.id, true, 10 / stop);
                }
              } else {
                components.PlayButton.prototype.inSetValue.call(button, value);
              }

              button.send(value ? button.on : button.off);
            },
            connect: () => {
              const { play: button, cue } = this.inputs;
              button["#blinker"] = this.mpfx.__blinker.onUpdate((_, long) => {
                let on = engine.getValue(this.group, "track_loaded");
                if (on && !engine.getValue(this.group, "play")) {
                  on = long;
                }

                button.send(on ? button.on : button.off);
              });

              button.connections.push(
                engine.makeConnection(this.group, "play", (value) => {
                  button.send(value && !cue.isPressed ? button.on : button.off);
                }),
              );
            },
            disconnect: () => {
              this.mpfx.__blinker.remove(this.inputs.play["#blinker"], true);
              components.PlayButton.prototype.disconnect.call(this.inputs.play);
            },
          }),
          cue: new components.CueButton({
            shiftOffset: 0x04,
            input: (...args) => {
              const { cue } = this.inputs;
              if (cue.isPressed != args[2]) {
                Object.assign(cue, {
                  isPressed: args[2],
                });

                components.CueButton.prototype.input.call(cue, ...args);
              }

              cue.send(cue.isPressed ? cue.on : cue.off);
            },
            // Disable Mixxx's default cue's led behavior
            connect: () => {},
          }),
          sync: new components.SyncButton({
            sendShifted: true,
            shiftControl: true,
            shiftOffset: 0x01,
          }),
          load: new components.Button({
            shift() {
              this.inKey = "eject";
            },
            unshift() {
              this.inKey = "LoadSelectedTrack";
            },
          }),
          pfl: new components.Button({
            type: components.Button.prototype.types.toggle,
            connect: () => {
              const { pfl: button } = this.inputs;
              button.group = this.group;
              button.midi = [this.bytes.id, 0x1b];
              button.connections.push(
                engine.makeConnection(this.group, "pfl", (on) => {
                  button.send(on ? button.on : button.off);
                }),
              );

              button.trigger();
            },
            shift() {
              this.inKey = this.outKey = "slip_enabled";
              this.trigger();
            },
            unshift() {
              this.inKey = this.outKey = "pfl";
              this.trigger();
            },
          }),
        },
        /**@type {typeof this.track} */
        track: (allow_idle = false) => {
          if (!engine.getValue(this.group, "track_loaded")) {
            if (!allow_idle) return;
            const idleTrack = this.mpfx.Channel.IdleStaticTrack;
            Object.defineProperty(idleTrack.state, "rate", {
              get: () => {
                const [rate, rateRange] = [
                  engine.getValue(this.group, "rate") * -1,
                  engine.getValue(this.group, "rateRange"),
                ];
                return {
                  value: rate,
                  range: rateRange,
                  rate: rate / rateRange,
                  bpm: engine.getValue(this.group, "bpm"),
                  keyLocked: !!engine.getValue(this.group, "keylock"),
                };
              },
            });

            return idleTrack;
          }

          /**@type {mpfx.Track} */
          let track = {
            _hasPlayer: false,
          };
          const player = engine.getPlayer?.(this.group);
          if (player) {
            Object.assign(track, player);
            track._hasPlayer = true;
          }

          const duration = engine.getValue(this.group, "duration");
          Object.assign(track, {
            bpm: engine.getValue(this.group, "file_bpm"),
            duration,
            keyNum: engine.getValue(this.group, "file_key"),
          });

          Object.defineProperty(track, "state", {
            /**@returns {mpfx.TrackState} */
            get: () => {
              const [rate, rateRange] = [
                engine.getValue(this.group, "rate") * -1,
                engine.getValue(this.group, "rateRange"),
              ];

              const position = engine.getValue(this.group, "playposition");
              const elapsed = duration * position;
              const remaining = duration * (1 - position);

              return {
                rate: {
                  value: rate,
                  range: rateRange,
                  rate: rate / rateRange,
                  bpm: engine.getValue(this.group, "bpm"),
                  keyLocked: !!engine.getValue(this.group, "keylock"),
                },
                time: {
                  elapsed,
                  remaining,
                  rate: position,
                },
                key: engine.getValue(this.group, "key"),
              };
            },
          });

          return track;
        },
      });
    },
    components.Component,
  ),
  /**
   * @type {typeof mpfx.Deck}
   */
  Deck: createMPFXComponent(function (parent, id, channels) {
    if (!channels?.length) {
      this.mpfx.error(
        `Unable to initalize deck #${id} : no trackable channels given.`,
      );
      return;
    }

    this.mpfx.debug(
      `Initializing Deck #${id} (tracking channels ${channels.map((c) => c.id)})`,
    );

    parent({
      id,
      trackables: channels,

      /**@type {typeof this.track} */
      track: (channel) => {
        if (typeof channel === "number") {
          channel = this.mpfx.$components.channels[channel];
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
        channel.trackedBy = this;
        Object.assign(this, {
          channel,
        });

        // Update the screen before forcing the switch
        this.updateScreen();

        // Update the play button led state
        const { play, cue } = this.channel.inputs;
        play.send(
          engine.getValue(this.channel.group, "play") ? play.on : play.off,
        );
        cue.send(cue.off);

        // Update the skin to a 4-deck one if wanted
        if (this.mpfx.CONFIG.decks.syncDecksSkin) {
          const use4DeckSkin =
            this.channel.id > 2 || this.brother?.channel?.id > 2;

          engine.setValue("[Skin]", "show_4decks", use4DeckSkin);
        }

        // Force track to the given channel.
        midi.sendShortMsg(channel.bytes.id, 0x08, 0x7f);

        // We may need to update the brother's bpm arrows
        // In case the brother's deck channel idling state differs from current
        if (this.brother?.channel) {
          this.brother.updateScreen({ bpm_arrows: true });
        }

        this.mpfx.debug(
          `Deck #${this.id} is now tracking channel ${channel.id}`,
        );
      },
      switch: () => {
        this.mpfx.debug(`Switching channel on deck #${this.id}...`);

        const currentIndex = this.trackables.findIndex(
          (c) => c.id === this.channel?.id,
        );
        if (currentIndex < 0) {
          return this.track(this.trackables[0]);
        }

        const nextIndex = (currentIndex + 1) % this.trackables.length;
        return this.track(this.trackables[nextIndex]);
      },
      /**@type {typeof this.updateScreen} */
      updateScreen: (only) => {
        const { state, duration, _isIdle } = this.channel.track(true);

        /**@type {(part:mpfx.ScreenParts) => boolean} */
        const send = (part) => !only || only[part];

        /**@type {number[][]} */
        const sysexMessages = [];
        /**@type {[number, number, number][]} */
        const shortMessages = [];

        const screenNumbersPrefix = [0xf0, 0x00, 0x20, 0x7f, this.channel.id];
        if (send("bpm")) {
          sysexMessages.push([
            ...screenNumbersPrefix,
            0x01,
            ...this.mpfx.intToBytes(
              parseInt(state.rate.bpm * 10) * 10,
              6,
              true,
            ),
            0xf7,
          ]);
        }
        if (send("rate")) {
          sysexMessages.push([
            ...screenNumbersPrefix,
            0x02,
            ...this.mpfx.intToBytes(state.rate.value * 1e4, 6),
            0xf7,
          ]);
        }
        if (send("rateRange")) {
          shortMessages.push([
            0x90 | (this.channel.id - 1),
            0x0e,
            parseInt(state.rate.range * 1e2),
          ]);
        }
        if (send("time")) {
          const { showRemainingInsteadOfElapsed, inverseWhenShifting } =
            this.mpfx.CONFIG.screen.time;

          const inverseMode = inverseWhenShifting && this.isShifted;
          const showRemaining = showRemainingInsteadOfElapsed
            ? !inverseMode
            : inverseMode;

          const time = showRemaining
            ? state.time.remaining
            : state.time.elapsed;

          sysexMessages.push(
            [
              ...screenNumbersPrefix,
              0x03,
              ...this.mpfx.intToBytes(duration * 1e3),
              0xf7,
            ],
            [
              ...screenNumbersPrefix,
              0x04,
              ...this.mpfx.intToBytes(time * 1e3),
              0xf7,
            ],
          );

          // As we update the time, we also update the spinners

          // position bar
          shortMessages.push([
            0xb0 | (this.channel.id - 1),
            0x3f,
            parseInt(state.time.rate * 52),
          ]);

          // spinner
          const { oneSpinDuration, filledSpin } =
            this.mpfx.CONFIG.screen.spinner;

          const spinPosition =
            (state.time.elapsed % oneSpinDuration) / oneSpinDuration;
          // If spinPosition is bellow 0, we invert the defined fill mode, and use the invert of the spinPosition
          const spinShift = filledSpin === spinPosition > 0 ? 65 : 1;
          const clampedSpinPosition =
            spinPosition < 0 ? 1 - Math.abs(spinPosition) : spinPosition;

          shortMessages.push([
            0xb0 | (this.channel.id - 1),
            0x06,
            spinShift + parseInt(clampedSpinPosition * 52),
          ]);
        }

        if (send("keylock")) {
          // ? why the fuck do we have 2 messages for 1 thing ??
          shortMessages.push(
            [0x80 | (this.channel.id - 1), 0x0d, 0x7f * +state.rate.keyLocked],
            [0x90 | (this.channel.id - 1), 0x0d, 0x7f * +state.rate.keyLocked],
          );
        }

        // If we update the screen's bpm, we also update the screen's bpm arrows
        if (send("bpm") || send("bpm_arrows")) {
          const brotherChannel = this.brother?.channel;
          if (!brotherChannel) {
            this.mpfx.warn(
              `Cannot refresh bpm arrows if decks are not registered in components.`,
            );
          } else {
            const brotherTrack = brotherChannel.track(true);
            let [up, down] = [false, false];
            if (!(_isIdle || brotherTrack._isIdle)) {
              const {
                state: {
                  rate: { bpm: brotherBpm },
                },
              } = brotherTrack;
              [up, down] = [
                brotherBpm > state.rate.bpm,
                brotherBpm < state.rate.bpm,
              ];
            }

            shortMessages.push(
              // up arrow
              [0x80 | (this.channel.id - 1), 0x09, +up * 0x7f],
              // down arrow
              [0x80 | (this.channel.id - 1), 0x0a, +down * 0x7f],
            );
          }
        }

        this.mpfx.debug(
          `Updating ${sysexMessages.length + shortMessages.length} part(s) of the deck #${this.id}'s screen.`,
        );
        sysexMessages.forEach((msg) => midi.sendSysexMsg(msg, msg.length));
        shortMessages.forEach((msg) => midi.sendShortMsg(...msg));
      },
    });

    Object.defineProperty(this, "brother", {
      get: () => {
        return this.mpfx.$components.decks?.[[1, 2][this.id % 2]];
      },
    });

    channels.forEach((channel) => {
      engine.makeConnection(channel.group, "playposition", () => {
        if (channel.id !== this.channel.id) return;
        this.updateScreen({ time: true });
      });
      engine.makeConnection(channel.group, "rate", () => {
        if (channel.id !== this.channel.id) return;
        this.updateScreen({ rate: true });
      });
      engine.makeConnection(channel.group, "bpm", () => {
        if (channel.id !== this.channel.id) return;
        this.updateScreen({ bpm: true });
        this.brother?.updateScreen({ bpm_arrows: true });
      });
      engine.makeConnection(channel.group, "keylock", () => {
        if (channel.id !== this.channel.id) return;
        this.updateScreen({ keylock: true });
      });
      engine.makeConnection(channel.group, "eject", () => {
        if (channel.id !== this.channel.id) return;
        this.updateScreen(undefined, "force");
      });
      engine.makeConnection(channel.group, "track_loaded", () => {
        if (channel.id !== this.channel.id) return;
        this.updateScreen(undefined, "force");
      });
    });
  }, components.ComponentContainer),
  /**
   * @type {typeof mpfx.Effect}
   */
  Effect: createMPFXComponent(function (parent, unit, effect) {
    this.mpfx.debug(`Initializing effect #${effect} from unit #${unit.id}`);

    const {
      FX: { longPressing },
      leds: { blinker },
    } = this.mpfx.CONFIG;
    const longPressTimeout =
      longPressing !== false
        ? typeof longPressing === "boolean"
          ? (typeof blinker.delay === "number" ? blinker.delay : 500) * 2
          : longPressing
        : false;

    this.mpfx.debug(
      `Long press behavior is ${longPressTimeout ? `enabled (tm: ${longPressTimeout}ms)` : "disabled"}.`,
    );

    parent({
      id: effect,
      group: `[EffectRack1_EffectUnit${unit.id}_Effect${effect}]`,
      key: "enabled",
      midi: [0x98 + (unit.id - 1), effect - 1 + 3 * (unit.id - 1)],
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
          this.mpfx.$components.effects.pad.units.forEach((u) =>
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
  }, components.Button),
  /**
   * @type {typeof mpfx.EffectUnit}
   */
  EffectUnit: createMPFXComponent(function (parent, unit) {
    this.mpfx.debug(`Initializing Effect Unit #${unit}...`);
    parent(unit, true);

    Object.assign(this, { id: unit });
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

    Object.assign(this, {
      /**@type {typeof this['clearSelection']} */
      clearSelection: () => {
        effects.forEach((e) => e.unselect());
      },
      /**@type {typeof this['selectAll']} */
      selectAll: () => {
        effects.forEach((e) => e.select());
      },
      /**@type {typeof this.send} */
      send: (channel) => {
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
      },
      /**@type {typeof this.unsend} */
      unsend: (channel) => {
        if (!this.isSendingTo(channel)) {
          this.warn(
            `EffectUnit #${this.id} is not sending to channel ${channel.id}.`,
          );
          return;
        }

        engine.setValue(this.group, `group_${channel.group}_enable`, 0);
        sendingCache.delete(channel.id);
        this.mpfx.log(
          `EffectUnit #${this.id} is not longer sending to channel ${channel.id}`,
        );
      },
      /**@type {typeof this.isSendingTo} */
      isSendingTo: (channel) => {
        return sendingCache.has(channel.id);
      },

      clearFocus: () => {
        this.focusedEffect?.unfocus();
      },
      focusNext: () => {
        const focused = this.focusedEffect;
        if (focused) {
          effects.at(focused.id % 3);
        } else {
          effects[0].focus();
        }
      },
      focusPrevious: () => {
        const focused = this.focusedEffect;
        if (focused) {
          effects.at(focused.id - 2);
        } else {
          effects.at(-1).focus();
        }
      },
    });

    this.mpfx.__blinker.onUpdate((short, long) => {
      effects.forEach((effect) => {
        const on =
          effect.isLongPressed || effect.isFocused
            ? short
            : effect.isSelected && (this.isSending ? long : true);

        effect.led(on);
      });
    });

    this.init();
  }, components.EffectUnit),
  /**
   * @type {typeof mpfx.EffectPad}
   */
  EffectPad: createMPFXComponent(function (parent, units) {
    parent(this.mpfx.keyBy(units, "id"));
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
  }, components.ComponentContainer),
  /**
   * @type {typeof mpfx.EffectPadSender}
   */
  EffectPadSender: createMPFXComponent(function (
    parent,
    sender,
    pad,
    channels,
  ) {
    this.mpfx.debug(
      `Initializing effect pad sender #${sender} for channels ${channels.map((c) => c.id)}.`,
    );

    parent({
      id: sender,
      pad,
      channels,
      type: components.Button.prototype.types.push,
      inValueScale: (value) => value && 1,
      inGetValue: () => {
        const { sendToHidden } = this.mpfx.CONFIG.FX;
        for (const channel of this.channels) {
          if (!(sendToHidden || channel.trackedBy)) continue;
          for (const unit of this.pad.units) {
            if (unit.isSendingTo(channel)) {
              return true;
            }
          }
        }

        return false;
      },
      inSetValue: (value) => {
        const { sendToHidden } = this.mpfx.CONFIG.FX;

        for (const channel of this.channels) {
          if (!(sendToHidden || channel.trackedBy)) continue;
          for (const unit of this.pad.units) {
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
        for (const channel of this.channels) {
          for (const unit of this.pad.units) {
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
  }, components.Button),
  /**@type {typeof mpfx.EffectMixer} */
  EffectMixer: createMPFXComponent(function (parent, pad, senders) {
    this.mpfx.debug("Initializing effect mixer...");

    parent({
      pad,
      senders: new components.ComponentContainer(this.mpfx.keyBy(senders)),
      beats: new components.Encoder({
        input: (_, _, value) => {
          const key = ["meta", "parameter1"][+this.isShifted];
          /**
           * Increase -> value == 0x01
           * Decrease -> value == 0x7f
           */
          const direction = value - 1 ? -1 : 1;

          const { units } = this.pad;
          const affected = units.map((u) => u.focusedEffect).filter((e) => !!e);

          if (!affected.length) {
            units.forEach((u) => affected.push(...u.effects));
          }

          affected.forEach((effect) => {
            const current = engine.getParameter(effect.group, key);
            engine.setParameter(
              effect.group,
              key,
              current + this.mpfx.CONFIG.FX.beatParamShiftRange * direction,
            );
          });
        },
      }),
    });

    this.mpfx.debug("FX Mixer ready !");
  }, components.ComponentContainer),

  /**@type {typeof mpfx.Browser} */
  Browser: createMPFXComponent(function (parent) {
    let shifts = [false, false];
    let browsing_speed = 0;
    let browser_speed_timer = undefined;

    parent({
      knob: new components.Encoder({
        input: (_, _, value) => {
          const up = value > 0x40;

          if (
            this.isShifted &&
            this.mpfx.CONFIG.browser.zoomWaveformsWhenShiftBrowse
          ) {
            const channel =
              // ? right shift is taken before the left one
              this.mpfx.$components.decks[shifts[1] ? 2 : 1].channel;

            engine.setParameter(
              channel.group,
              `waveform_zoom_${up ? "up" : "down"}`,
              1,
            );
          } else {
            if (browser_speed_timer) {
              browser_speed_timer = engine.stopTimer(browser_speed_timer);
            }

            browser_speed_timer = engine.beginTimer(
              60,
              () => {
                browsing_speed = 0;
              },
              true,
            );

            browsing_speed = (browsing_speed + 1) % 4;
            engine.setParameter(
              "[Library]",
              "MoveVertical",
              browsing_speed * (up ? -1 : 1),
            );
          }
        },
      }),
      selector: new components.Button({
        group: "[Library]",
        shiftControl: true,
        shiftOffset: 0x01,
        input: (...args) => {
          const pressing = args[2];

          if (
            pressing &&
            this.mpfx.CONFIG.browser.rightShiftedSelectPreviewsTrack &&
            shifts[1]
          ) {
            if (engine.getValue("[PreviewDeck1]", "track_loaded")) {
              script.triggerControl("[PreviewDeck1]", "stop");
              script.triggerControl("[PreviewDeck1]", "eject");
            } else {
              this.mpfx.debug("Inserting selected in preview deck...");

              script.triggerControl(
                "[PreviewDeck1]",
                "LoadSelectedTrackAndPlay",
              );
            }
          } else {
            components.Button.prototype.input.call(this.selector, ...args);
          }
        },
        shift() {
          this.inKey = "GoToItem";
        },
        unshift() {
          this.inKey = "MoveFocusForward";
        },
      }),
    });

    this.mpfx.listenFor("shift", (right) => {
      shifts[+right] = true;
    });
    this.mpfx.listenFor("unshift", (right) => {
      shifts[+right] = false;
    });
  }, components.ComponentContainer),
  /* #endregion */
};

/**
 * @type {typeof mpfx.componentMaker}
 */
function createMPFXComponent(statics, constructor, Parent = undefined) {
  if (typeof statics === "function") {
    return createMPFXComponent({}, statics, constructor);
  }

  let mpfxKey = "mpfx";
  if (typeof constructor !== "function") {
    mpfxKey = constructor.mpfxKey;
    constructor = constructor.constructor;
  }

  function Component(...componentArgs) {
    MixtrackPlatinumFX.bindTo(this, mpfxKey);
    let parentInitied = true;

    if (Parent) {
      // If there is a parent, the code must use the "super"-like function
      parentInitied = false;
      componentArgs.unshift((...parentArgs) => {
        Parent.call(this, ...parentArgs);
        parentInitied = true;
      });
    }

    constructor.call(this, ...componentArgs);
    if (!parentInitied) {
      throw new Error("A parent has been binded without having being inited.");
    }
  }

  if (Parent) {
    constructor.prototype = Object.create(Parent.prototype);
  }
  Component.prototype = Object.create(constructor.prototype);

  return Object.assign(Component, statics);
}
