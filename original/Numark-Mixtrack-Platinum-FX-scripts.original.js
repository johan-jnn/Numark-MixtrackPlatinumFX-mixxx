var MixtrackPlatinumFXLegacy = {};

// FX toggles
MixtrackPlatinumFXLegacy.toggleFXControlEnable = true;
MixtrackPlatinumFXLegacy.toggleFXControlSuper = false;

MixtrackPlatinumFXLegacy.shifBrowseIsZoom = false;

// setting this to false sets tap the file bpm, but without a way to reset its dangerous
MixtrackPlatinumFXLegacy.tapChangesTempo = true;

// pitch ranges
// add/remove/modify steps to your liking
// default step must be set in Mixxx settings
// setting is stored per deck in pitchRange.currentRangeIdx
MixtrackPlatinumFXLegacy.pitchRanges = [0.08, 0.16, 0.5];

MixtrackPlatinumFXLegacy.HIGH_LIGHT = 0x7f;
MixtrackPlatinumFXLegacy.LOW_LIGHT = 0x01;

// whether the corresponding Mixxx option is enabled
// (Settings -> Preferences -> Waveforms -> Synchronize zoom level across all waveforms)
MixtrackPlatinumFXLegacy.waveformsSynced = true;

// jogwheel
MixtrackPlatinumFXLegacy.jogScratchSensitivity = 1024;
MixtrackPlatinumFXLegacy.jogScratchAlpha = 1; // do NOT set to 2 or higher
MixtrackPlatinumFXLegacy.jogScratchBeta = 1 / 32;
MixtrackPlatinumFXLegacy.jogPitchSensitivity = 10;
MixtrackPlatinumFXLegacy.jogSeekSensitivity = 10000;

// blink settings
MixtrackPlatinumFXLegacy.enableBlink = true;
MixtrackPlatinumFXLegacy.blinkDelay = 700;

// autoloop sizes, for available values see:
// https://manual.mixxx.org/2.3/en/chapters/appendix/mixxx_controls.html#control-[ChannelN]-beatloop_X_toggle
MixtrackPlatinumFXLegacy.autoLoopSizes = [
  "0.0625",
  "0.125",
  "0.25",
  "0.5",
  "1",
  "2",
  "4",
  "8",
];

// beatjump values, for available values see:
// https://manual.mixxx.org/2.3/en/chapters/appendix/mixxx_controls.html#control-[ChannelN]-beatjump_X_forward
// underscores (_) at the end are needed because numeric values (e.g. 8) have two underscores (e.g. beatjump_8_forward),
// but "beatjump_forward"/"beatjump_backward" have only one underscore
MixtrackPlatinumFXLegacy.beatJumpValues = [
  "0.0625_",
  "0.125_",
  "0.25_",
  "0.5_",
  "1_",
  "2_",
  "", // "beatjump_forward"/"beatjump_backward" - jump by the value selected in Mixxx GUI (4 by default)
  "8_",
];

// dim all lights when inactive instead of turning them off
components.Button.prototype.off = MixtrackPlatinumFXLegacy.LOW_LIGHT;

// pad modes control codes
MixtrackPlatinumFXLegacy.PadModeControls = {
  HOTCUE: 0x00,
  AUTOLOOP: 0x0d,
  FADERCUTS: 0x07,
  SAMPLE1: 0x0b,
  BEATJUMP: 0x01, // DUMMY not used by controller
  SAMPLE2: 0x0f,
  AUTOLOOP2: 0x0e, // DUMMY not used by controller
  KEYPLAY: 0x0c, // DUMMY not used by controller
  HOTCUE2: 0x02,
  FADERCUTS2: 0x03, // DUMMY not used by controller
  FADERCUTS3: 0x04, // DUMMY not used by controller
  AUTOLOOP3: 0x05, // DUMMY not used by controller
};

// enables 4 bottom pads "fader cuts" for 8
MixtrackPlatinumFXLegacy.faderCutSysex8 = [0xf0, 0x00, 0x20, 0x7f, 0x03, 0xf7];
// enables only 4 top pads "fader cuts"
MixtrackPlatinumFXLegacy.faderCutSysex4 = [0xf0, 0x00, 0x20, 0x7f, 0x13, 0xf7];

// state variable, don't touch
MixtrackPlatinumFXLegacy.shifted = false;

MixtrackPlatinumFXLegacy.initComplete = false;

MixtrackPlatinumFXLegacy.bpms = [];
MixtrackPlatinumFXLegacy.trackBPM = function (value, group, control) {
  // file_bpm always seems to be 0?
  // this doesn't work if we have to scan for bpm as it will be zero initially
  // so we hook into the bpm change as well, and if we have 0 then set it to the first value seen (in bpm output)
  MixtrackPlatinumFXLegacy.bpms[script.deckFromGroup(group) - 1] =
    engine.getValue(group, "bpm");
};

MixtrackPlatinumFXLegacy.BlinkTimer = 0;
MixtrackPlatinumFXLegacy.BlinkState = true;
MixtrackPlatinumFXLegacy.BlinkStateSlow = true;
MixtrackPlatinumFXLegacy.CallBacks = [];
MixtrackPlatinumFXLegacy.CallSpeed = [];
MixtrackPlatinumFXLegacy.BlinkStart = function (callback, slow) {
  for (var i in MixtrackPlatinumFXLegacy.CallBacks) {
    if (!MixtrackPlatinumFXLegacy.CallBacks[i]) {
      // empty slot
      MixtrackPlatinumFXLegacy.CallBacks[i] = callback;
      MixtrackPlatinumFXLegacy.CallSpeed[i] = slow;
      return i + 1;
    }
  }
  var idx = MixtrackPlatinumFXLegacy.CallBacks.push(callback);
  MixtrackPlatinumFXLegacy.CallSpeed[idx - 1] = slow;
  return idx;
};
MixtrackPlatinumFXLegacy.BlinkStop = function (index) {
  MixtrackPlatinumFXLegacy.CallBacks[index - 1] = null;
};
MixtrackPlatinumFXLegacy.BlinkFunc = function () {
  // toggle the global blink variables
  MixtrackPlatinumFXLegacy.BlinkState = !MixtrackPlatinumFXLegacy.BlinkState;
  if (MixtrackPlatinumFXLegacy.BlinkState) {
    MixtrackPlatinumFXLegacy.BlinkStateSlow =
      !MixtrackPlatinumFXLegacy.BlinkStateSlow;
  }

  // if we should be blinking the fx, then call its function
  if (MixtrackPlatinumFXLegacy.FxBlinkState) {
    MixtrackPlatinumFXLegacy.FxBlinkUpdateLEDs();
  }
  // fire any callbacks
  for (var i in MixtrackPlatinumFXLegacy.CallBacks) {
    if (MixtrackPlatinumFXLegacy.CallBacks[i]) {
      if (MixtrackPlatinumFXLegacy.CallSpeed[i]) {
        if (MixtrackPlatinumFXLegacy.BlinkState) {
          MixtrackPlatinumFXLegacy.CallBacks[i](
            MixtrackPlatinumFXLegacy.BlinkStateSlow,
          );
        }
      } else {
        MixtrackPlatinumFXLegacy.CallBacks[i](
          MixtrackPlatinumFXLegacy.BlinkState,
        );
      }
    }
  }
};

MixtrackPlatinumFXLegacy.init = function (id, debug) {
  MixtrackPlatinumFXLegacy.id = id;
  MixtrackPlatinumFXLegacy.debug = debug;
  print("init MixtrackPlatinumFX " + id + " debug: " + debug);

  // disable demo lightshow
  var exitDemoSysex = [0xf0, 0x7e, 0x00, 0x06, 0x01, 0xf7];
  midi.sendSysexMsg(exitDemoSysex, exitDemoSysex.length);

  // status, extra 04 is just more device id, not sure what the 05 is
  //F0 00 20 04 7F 03 01 05 F7

  // wake (not sure what the extra 07 is for?
  //F0 7E 00 07 06 01 F7

  // I think these are the dial updates
  //F0 00 20 04 7F 02 02 04 08 00 00 04 00 00 00 05 F7
  //F0 00 20 04 7F 04 01 04 00 00 00 04 00 00 00 05 F7
  //F0 00 20 04 7F 02 04 04 08 00 00 04 00 00 00 07 00 00 F7
  //F0 00 20 04 7F 03 02 04 08 00 00 04 00 00 00 05 F7
  //F0 00 20 04 7F 03 04 04 08 00 00 04 00 00 00 07 00 00 F7
  //F0 00 20 04 7F 01 04 04 08 00 00 04 00 00 00 07 00 00 F7
  //F0 00 20 04 7F 04 04 04 08 00 00 04 00 00 00 07 00 00 F7

  // default to just the top 4
  midi.sendSysexMsg(
    MixtrackPlatinumFXLegacy.faderCutSysex4,
    MixtrackPlatinumFXLegacy.faderCutSysex4.length,
  );

  // initialize component containers
  MixtrackPlatinumFXLegacy.deck = new components.ComponentContainer();
  MixtrackPlatinumFXLegacy.effect = new components.ComponentContainer();
  var i;
  for (i = 0; i < 4; i++) {
    var group = "[Channel" + (i + 1) + "]";
    MixtrackPlatinumFXLegacy.deck[i] = new MixtrackPlatinumFXLegacy.Deck(i + 1);
    MixtrackPlatinumFXLegacy.updateRateRange(
      i,
      group,
      MixtrackPlatinumFXLegacy.pitchRanges[0],
    );
    // refresh keylock state (the output mapping in the xml doesn't seem to do it
    midi.sendShortMsg(
      0x80 | i,
      0x0d,
      engine.getValue(group, "keylock") ? 0x7f : 0x00,
    );
    midi.sendShortMsg(
      0x90 | i,
      0x0d,
      engine.getValue(group, "keylock") ? 0x7f : 0x00,
    );
    // Hook into this and save the bpm_file when loaded so we can reset it later
    engine
      .makeConnection(group, "track_loaded", MixtrackPlatinumFXLegacy.trackBPM)
      .trigger();
  }
  for (i = 0; i < 2; i++) {
    MixtrackPlatinumFXLegacy.effect[i] =
      new MixtrackPlatinumFXLegacy.EffectUnit((i % 2) + 1);
  }
  // turn effect for master and headphones off to avoid confusion
  engine.setValue("[EffectRack1_EffectUnit1]", "group_[Headphone]_enable", 0);
  engine.setValue("[EffectRack1_EffectUnit2]", "group_[Headphone]_enable", 0);
  engine.setValue("[EffectRack1_EffectUnit1]", "group_[Master]_enable", 0);
  engine.setValue("[EffectRack1_EffectUnit2]", "group_[Master]_enable", 0);

  MixtrackPlatinumFXLegacy.browse = new MixtrackPlatinumFXLegacy.Browse();
  MixtrackPlatinumFXLegacy.gains = new MixtrackPlatinumFXLegacy.Gains();

  var statusSysex = [0xf0, 0x00, 0x20, 0x7f, 0x03, 0x01, 0xf7];
  midi.sendSysexMsg(statusSysex, statusSysex.length);

  engine.makeConnection(
    "[Channel1]",
    "VuMeter",
    MixtrackPlatinumFXLegacy.vuCallback,
  );
  engine.makeConnection(
    "[Channel2]",
    "VuMeter",
    MixtrackPlatinumFXLegacy.vuCallback,
  );
  engine.makeConnection(
    "[Channel3]",
    "VuMeter",
    MixtrackPlatinumFXLegacy.vuCallback,
  );
  engine.makeConnection(
    "[Channel4]",
    "VuMeter",
    MixtrackPlatinumFXLegacy.vuCallback,
  );

  engine
    .makeConnection("[Channel1]", "rate", MixtrackPlatinumFXLegacy.rateCallback)
    .trigger();
  engine
    .makeConnection("[Channel2]", "rate", MixtrackPlatinumFXLegacy.rateCallback)
    .trigger();
  engine
    .makeConnection("[Channel3]", "rate", MixtrackPlatinumFXLegacy.rateCallback)
    .trigger();
  engine
    .makeConnection("[Channel4]", "rate", MixtrackPlatinumFXLegacy.rateCallback)
    .trigger();

  // trigger is needed to initialize lights to 0x01
  MixtrackPlatinumFXLegacy.deck.forEachComponent(function (component) {
    component.trigger();
  });
  MixtrackPlatinumFXLegacy.effect.forEachComponent(function (component) {
    component.trigger();
  });

  // set FX buttons init light)
  midi.sendShortMsg(0x98, 0x00, MixtrackPlatinumFXLegacy.LOW_LIGHT);
  midi.sendShortMsg(0x98, 0x01, MixtrackPlatinumFXLegacy.LOW_LIGHT);
  midi.sendShortMsg(0x98, 0x02, MixtrackPlatinumFXLegacy.LOW_LIGHT);
  midi.sendShortMsg(0x99, 0x03, MixtrackPlatinumFXLegacy.LOW_LIGHT);
  midi.sendShortMsg(0x99, 0x04, MixtrackPlatinumFXLegacy.LOW_LIGHT);
  midi.sendShortMsg(0x99, 0x05, MixtrackPlatinumFXLegacy.LOW_LIGHT);

  // since we default to active on deck 1 and 2 make sure the controller does too
  midi.sendShortMsg(0x90, 0x08, 0x7f);
  midi.sendShortMsg(0x91, 0x08, 0x7f);

  // setup elapsed/remaining tracking
  engine.makeConnection(
    "[Controls]",
    "ShowDurationRemaining",
    MixtrackPlatinumFXLegacy.timeElapsedCallback,
  );
  MixtrackPlatinumFXLegacy.initComplete = true;
  MixtrackPlatinumFXLegacy.updateArrows(true);

  MixtrackPlatinumFXLegacy.BlinkTimer = engine.beginTimer(
    MixtrackPlatinumFXLegacy.blinkDelay / 2,
    MixtrackPlatinumFXLegacy.BlinkFunc,
  );
};

MixtrackPlatinumFXLegacy.shutdown = function () {
  var shutdownSysex = [0xf0, 0x00, 0x20, 0x7f, 0x02, 0xf7];
  var i;

  if (MixtrackPlatinumFXLegacy.BlinkTimer != 0) {
    engine.stopTimer(MixtrackPlatinumFXLegacy.BlinkTimer);
    MixtrackPlatinumFXLegacy.BlinkTimer = 0;
  }

  for (i = 0; i < 4; i++) {
    // update spinner and position indicator
    midi.sendShortMsg(0xb0 | i, 0x3f, 0);
    midi.sendShortMsg(0xb0 | i, 0x06, 0);
    // keylock indicator
    midi.sendShortMsg(0x80 | i, 0x0d, 0x00);
    // turn off bpm arrows
    midi.sendShortMsg(0x80 | i, 0x0a, 0x00); // down arrow off
    midi.sendShortMsg(0x80 | i, 0x09, 0x00); // up arrow off

    MixtrackPlatinumFXLegacy.sendScreenRateMidi(i + 1, 0);
    midi.sendShortMsg(0x90 + i, 0x0e, 0);
    MixtrackPlatinumFXLegacy.sendScreenBpmMidi(i + 1, 0);
    MixtrackPlatinumFXLegacy.sendScreenTimeMidi(i + 1, 0);
    MixtrackPlatinumFXLegacy.sendScreenDurationMidi(i + 1, 0);
  }

  // switch to decks 1 and 2
  midi.sendShortMsg(0x90, 0x08, 0x7f);
  midi.sendShortMsg(0x91, 0x08, 0x7f);

  midi.sendSysexMsg(shutdownSysex, shutdownSysex.length);
};

MixtrackPlatinumFXLegacy.shift = function () {
  MixtrackPlatinumFXLegacy.shifted = true;
  MixtrackPlatinumFXLegacy.deck.shift();
  MixtrackPlatinumFXLegacy.browse.shift();
  MixtrackPlatinumFXLegacy.effect.shift();
  MixtrackPlatinumFXLegacy.gains.cueGain.shift();
};

MixtrackPlatinumFXLegacy.unshift = function () {
  MixtrackPlatinumFXLegacy.shifted = false;
  MixtrackPlatinumFXLegacy.deck.unshift();
  MixtrackPlatinumFXLegacy.browse.unshift();
  MixtrackPlatinumFXLegacy.effect.unshift();
  MixtrackPlatinumFXLegacy.gains.cueGain.unshift();
};

MixtrackPlatinumFXLegacy.allEffectOff = function () {
  MixtrackPlatinumFXLegacy.effect[0].effects = [false, false, false];
  MixtrackPlatinumFXLegacy.effect[1].effects = [false, false, false];
  MixtrackPlatinumFXLegacy.FxBlinkUpdateLEDs();
  MixtrackPlatinumFXLegacy.effect[0].updateEffects();
  MixtrackPlatinumFXLegacy.effect[1].updateEffects();
};

MixtrackPlatinumFXLegacy.FxBlinkUpdateLEDs = function () {
  var newStates1 = [false, false, false];
  var newStates2 = [false, false, false];
  if (
    !MixtrackPlatinumFXLegacy.FxBlinkState ||
    MixtrackPlatinumFXLegacy.BlinkState
  ) {
    newStates1 = MixtrackPlatinumFXLegacy.effect[0].effects;
    newStates2 = MixtrackPlatinumFXLegacy.effect[1].effects;
  }
  midi.sendShortMsg(
    0x98,
    0x00,
    newStates1[0]
      ? MixtrackPlatinumFXLegacy.HIGH_LIGHT
      : MixtrackPlatinumFXLegacy.LOW_LIGHT,
  );
  midi.sendShortMsg(
    0x98,
    0x01,
    newStates1[1]
      ? MixtrackPlatinumFXLegacy.HIGH_LIGHT
      : MixtrackPlatinumFXLegacy.LOW_LIGHT,
  );
  midi.sendShortMsg(
    0x98,
    0x02,
    newStates1[2]
      ? MixtrackPlatinumFXLegacy.HIGH_LIGHT
      : MixtrackPlatinumFXLegacy.LOW_LIGHT,
  );
  midi.sendShortMsg(
    0x99,
    0x03,
    newStates2[0]
      ? MixtrackPlatinumFXLegacy.HIGH_LIGHT
      : MixtrackPlatinumFXLegacy.LOW_LIGHT,
  );
  midi.sendShortMsg(
    0x99,
    0x04,
    newStates2[1]
      ? MixtrackPlatinumFXLegacy.HIGH_LIGHT
      : MixtrackPlatinumFXLegacy.LOW_LIGHT,
  );
  midi.sendShortMsg(
    0x99,
    0x05,
    newStates2[2]
      ? MixtrackPlatinumFXLegacy.HIGH_LIGHT
      : MixtrackPlatinumFXLegacy.LOW_LIGHT,
  );
};

MixtrackPlatinumFXLegacy.FxBlinkTimer = 0;
MixtrackPlatinumFXLegacy.FxBlinkState = true;
MixtrackPlatinumFXLegacy.FxBlink = function () {
  var start =
    MixtrackPlatinumFXLegacy.effect[0].isSwitchHolded ||
    MixtrackPlatinumFXLegacy.effect[1].isSwitchHolded;

  if (start) {
    MixtrackPlatinumFXLegacy.FxBlinkState = true;
    MixtrackPlatinumFXLegacy.FxBlinkUpdateLEDs();
  } else {
    // stop
    MixtrackPlatinumFXLegacy.FxBlinkState = false;
    MixtrackPlatinumFXLegacy.FxBlinkUpdateLEDs();
  }
};

// TODO in 2.3 it is not possible to "properly" map the FX selection buttons.
// this should be done with load_preset and QuickEffects instead (when effect
// chain preset saving/loading is available in Mixxx)
MixtrackPlatinumFXLegacy.EffectUnit = function (deckNumber) {
  this.effects = [false, false, false];
  this.isSwitchHolded = false;

  this.updateEffects = function () {
    if (MixtrackPlatinumFXLegacy.toggleFXControlEnable) {
      for (var i = 1; i <= this.effects.length; i++) {
        engine.setValue(
          "[EffectRack1_EffectUnit" + deckNumber + "_Effect" + i + "]",
          "enabled",
          this.effects[i - 1],
        );
      }
    }
  };

  // switch values are:
  // 0 - switch in the middle
  // 1 - switch up
  // 2 - switch down
  this.enableSwitch = function (channel, control, value, status, group) {
    this.isSwitchHolded = value != 0;

    if (MixtrackPlatinumFXLegacy.toggleFXControlSuper) {
      engine.setValue(group, "super1", Math.min(value, 1.0));
    }

    var fxDeck = deckNumber;
    if (!MixtrackPlatinumFXLegacy.deck[deckNumber - 1].active) {
      fxDeck += 2;
    }
    engine.setValue(
      "[EffectRack1_EffectUnit1]",
      "group_[Channel" + fxDeck + "]_enable",
      value != 0,
    );
    engine.setValue(
      "[EffectRack1_EffectUnit2]",
      "group_[Channel" + fxDeck + "]_enable",
      value != 0,
    );

    this.updateEffects();

    MixtrackPlatinumFXLegacy.FxBlink();
  };

  this.dryWetKnob = new components.Pot({
    group: "[EffectRack1_EffectUnit" + deckNumber + "]",
    inKey: "mix",
  });

  this.effect1 = function (channel, control, value, status, group) {
    if (value == 0x7f) {
      if (!MixtrackPlatinumFXLegacy.shifted) {
        MixtrackPlatinumFXLegacy.allEffectOff();
      }
      this.effects[0] = !this.effects[0];
      midi.sendShortMsg(
        status,
        control,
        this.effects[0]
          ? MixtrackPlatinumFXLegacy.HIGH_LIGHT
          : MixtrackPlatinumFXLegacy.LOW_LIGHT,
      );
    }

    this.updateEffects();
  };

  this.effect2 = function (channel, control, value, status, group) {
    if (value == 0x7f) {
      if (!MixtrackPlatinumFXLegacy.shifted) {
        MixtrackPlatinumFXLegacy.allEffectOff();
      }
      this.effects[1] = !this.effects[1];
      midi.sendShortMsg(
        status,
        control,
        this.effects[1]
          ? MixtrackPlatinumFXLegacy.HIGH_LIGHT
          : MixtrackPlatinumFXLegacy.LOW_LIGHT,
      );
    }

    this.updateEffects();
  };

  this.effect3 = function (channel, control, value, status, group) {
    if (value == 0x7f) {
      if (!MixtrackPlatinumFXLegacy.shifted) {
        MixtrackPlatinumFXLegacy.allEffectOff();
      }
      this.effects[2] = !this.effects[2];
      midi.sendShortMsg(
        status,
        control,
        this.effects[2]
          ? MixtrackPlatinumFXLegacy.HIGH_LIGHT
          : MixtrackPlatinumFXLegacy.LOW_LIGHT,
      );
    }

    this.updateEffects();
  };

  // copy paste since I'm not sure if we want to handle it like this or not
  this.effectParam = new components.Encoder({
    group: "[EffectRack1_EffectUnit" + deckNumber + "_Effect1]",
    shift: function () {
      this.inKey = "meta";
    },
    unshift: function () {
      this.inKey = "parameter1";
    },
    input: function (channel, control, value) {
      this.inSetParameter(this.inGetParameter() + this.inValueScale(value));
    },
    inValueScale: function (value) {
      return value < 0x40 ? 0.05 : -0.05;
    },
  });
  this.effectParam2 = new components.Encoder({
    group: "[EffectRack1_EffectUnit" + deckNumber + "_Effect2]",
    shift: function () {
      this.inKey = "meta";
    },
    unshift: function () {
      this.inKey = "parameter1";
    },
    input: function (channel, control, value) {
      this.inSetParameter(this.inGetParameter() + this.inValueScale(value));
    },
    inValueScale: function (value) {
      return value < 0x40 ? 0.05 : -0.05;
    },
  });

  this.effectParam3 = new components.Encoder({
    group: "[EffectRack1_EffectUnit" + deckNumber + "_Effect3]",
    shift: function () {
      this.inKey = "meta";
    },
    unshift: function () {
      this.inKey = "parameter1";
    },
    input: function (channel, control, value) {
      this.inSetParameter(this.inGetParameter() + this.inValueScale(value));
    },
    inValueScale: function (value) {
      return value < 0x40 ? 0.05 : -0.05;
    },
  });
};

MixtrackPlatinumFXLegacy.EffectUnit.prototype =
  new components.ComponentContainer();

MixtrackPlatinumFXLegacy.activeForTap = function (value) {
  // fuzzy logic
  // to tap we probably want a playing deck
  // and we probably don't want it "live"
  // we will need it "active"
  // so best is a playing deck with pfl = 5
  // next best a stopped deck with pfl = 4
  // then a playing deck = 3
  // then a stopped deck without pfl (which by this point is any loaded) = 2
  // and as a fallback a deck that isn't active
  // if there are mulitple then the lowest number wins (1,2,3,4)
  // if no decks with loaded tracks then -1 so caller should check for that
  var i = 0;
  var winner = -1;
  var winnerScore = 0;
  for (i = 0; i < 4; i++) {
    if (engine.getValue("[Channel" + (i + 1) + "]", "track_loaded")) {
      if (MixtrackPlatinumFXLegacy.deck[i].active) {
        var localscore = 0;
        if (engine.getValue("[Channel" + (i + 1) + "]", "pfl")) {
          if (engine.getValue("[Channel" + (i + 1) + "]", "play")) {
            localscore = 5;
          } else {
            localscore = 4;
          }
        } else {
          if (engine.getValue("[Channel" + (i + 1) + "]", "play")) {
            localscore = 3;
          } else {
            localscore = 2;
          }
        }
      } else {
        localscore = 1;
      }
      if (localscore > winnerScore) {
        winnerScore = localscore;
        winner = i;
      }
    }
  }

  if (winner >= 0) {
    if (value > 0) {
      MixtrackPlatinumFXLegacy.updateArrows(false, true, winner);
    } else {
      MixtrackPlatinumFXLegacy.updateArrows(true);
    }
  }

  return winner;
};

MixtrackPlatinumFXLegacy.Deck = function (number) {
  components.Deck.call(this, number);

  var channel = number - 1;
  var deck = this;
  this.scratchModeEnabled = true;
  this.active = number == 1 || number == 2;

  this.setActive = function (active) {
    this.active = active;

    if (!active) {
      // trigger soft takeover on the pitch control
      this.pitch.disconnect();
    }
  };

  this.bpm = new components.Component({
    outKey: "bpm",
    output: function (value, group, control) {
      if (MixtrackPlatinumFXLegacy.bpms[script.deckFromGroup(group) - 1] == 0) {
        MixtrackPlatinumFXLegacy.bpms[script.deckFromGroup(group) - 1] =
          engine.getValue(group, "bpm");
      }
      MixtrackPlatinumFXLegacy.sendScreenBpmMidi(
        number,
        Math.round(value * 100),
      );
    },
  });

  this.duration = new components.Component({
    outKey: "duration",
    output: function (duration, group, control) {
      // update duration
      MixtrackPlatinumFXLegacy.sendScreenDurationMidi(number, duration * 1000);

      // when the duration changes, we need to update the play position
      deck.position.trigger();
    },
  });

  this.position = new components.Component({
    outKey: "playposition",
    output: function (playposition, group, control) {
      // the controller appears to expect a value in the range of 0-52
      // representing the position of the track. Here we send a message to the
      // controller to update the position display with our current position.
      var pos = Math.round(playposition * 52);
      if (pos < 0) {
        pos = 0;
      }
      midi.sendShortMsg(0xb0 | channel, 0x3f, pos);

      // get the current duration
      duration = deck.duration.outGetValue();

      // update the time display
      var time = MixtrackPlatinumFXLegacy.timeMs(
        number,
        playposition,
        duration,
      );
      MixtrackPlatinumFXLegacy.sendScreenTimeMidi(number, time);

      // update the spinner (range 64-115, 52 values)
      //
      // the visual spinner in the mixxx interface takes 1.8 seconds to loop
      // (60 seconds/min divided by 33 1/3 revolutions per min)
      var period = 60 / (33 + 1 / 3);
      var midiResolution = 52; // the controller expects a value range of 64-115
      var timeElapsed = duration * playposition;
      var spinner = Math.round(
        (timeElapsed % period) * (midiResolution / period),
      );
      if (spinner < 0) {
        spinner += 115;
      } else {
        spinner += 64;
      }

      midi.sendShortMsg(0xb0 | channel, 0x06, spinner);
    },
  });

  this.playButton = new components.PlayButton({
    midi: [0x90 + channel, 0x00],
    shiftControl: true,
    sendShifted: true,
    shiftOffset: 0x04,
  });

  this.playButton_beatgrid = function (channel, control, value, status, group) {
    engine.setValue(group, "beats_translate_curpos", value ? 1 : 0);
  };

  this.cueButton = new components.CueButton({
    midi: [0x90 + channel, 0x01],
    shiftControl: true,
    sendShifted: true,
    shiftOffset: 0x04,
  });

  this.syncButton = new components.SyncButton({
    midi: [0x90 + channel, 0x02],
    shiftControl: true,
    sendShifted: true,
    shiftOffset: 0x01,
  });

  // we get two midi callbacks for tap, but double taps will be confusing so we just ignore the second set
  if (number == 1) {
    if (MixtrackPlatinumFXLegacy.tapChangesTempo) {
      this.tap = new components.Button({
        unshift: function () {
          this.disconnect();
          this.input = function (channel, control, value, _status, _group) {
            var tapch = MixtrackPlatinumFXLegacy.activeForTap(value) + 1;
            if (tapch) {
              if (value > 0) {
                var prelen = bpm.tap.length;
                var predelta = bpm.previousTapDelta;
                bpm.tapButton(tapch);
                // if the array reset, or changed then the tap was "accepted"
                if (
                  bpm.tap.length == 0 ||
                  bpm.tap.length != prelen ||
                  predelta != bpm.previousTapDelta
                ) {
                  this.send(this.outValueScale(value));
                } else {
                  this.send(0);
                }
              } else {
                this.send(this.outValueScale(value));
              }
            }
          };
        },
        shift: function () {
          // reset rate to 0 (i.e. no tempo change)
          this.disconnect();
          this.input = function (channel, control, value, _status, _group) {
            var tapch = MixtrackPlatinumFXLegacy.activeForTap(value) + 1;
            if (value > 0 && tapch) {
              engine.setValue("[Channel" + tapch + "]", "rate", 0);
            }
          };
        },
        midi: [0x88, 0x09],
      });
      this.tap.output(0);
    } else {
      this.tap = new components.Button({
        shift: function () {
          this.disconnect();
          this.input = function (channel, control, value, _status, _group) {
            var tapch = MixtrackPlatinumFXLegacy.activeForTap(value) + 1;
            if (tapch) {
              // This doesn't work, it doesn't set the bpm, it sets the rate to achive this bpm
              if (value > 0 && MixtrackPlatinumFXLegacy.bpms[tapch - 1]) {
                engine.setValue(
                  "[Channel" + tapch + "]",
                  "bpm",
                  MixtrackPlatinumFXLegacy.bpms[tapch - 1],
                );
              }
              this.send(this.outValueScale(value));
            }
          };
        },
        unshift: function () {
          /*
					this.disconnect();
					this.input = components.Button.prototype.input;
					this.inKey = "bpm_tap";
					this.outKey = "bpm_tap";
					this.connect();
					this.trigger();
					*/
          this.disconnect();
          this.input = function (channel, control, value, _status, _group) {
            var tapch = MixtrackPlatinumFXLegacy.activeForTap(value) + 1;
            if (tapch) {
              engine.setValue("[Channel" + tapch + "]", "bpm_tap", value);
              this.send(this.outValueScale(value));
            }
          };
        },
        //key: "bpm_tap",
        midi: [0x88, 0x09],
      });
      this.tap.output(0);
    }
  } else {
    // ignore callbacks other than the first
    this.tap = new components.Button({
      // null, ignore the second mapping
      input: function (channel, control, value, _status, _group) {},
    });
  }

  this.pflButton = new components.Button({
    shift: function () {
      this.disconnect();
      this.inKey = "slip_enabled";
      this.outKey = "slip_enabled";
      this.connect();
      this.trigger();
    },
    unshift: function () {
      this.disconnect();
      this.inKey = "pfl";
      this.outKey = "pfl";
      this.connect();
      this.trigger();
    },
    type: components.Button.prototype.types.toggle,
    midi: [0x90 + channel, 0x1b],
  });

  this.loadButton = new components.Button({
    shift: function () {
      this.inKey = "eject";
    },
    unshift: function () {
      this.inKey = "LoadSelectedTrack";
    },
  });

  this.volume = new components.Pot({
    inKey: "volume",
  });

  this.treble = new components.Pot({
    group: "[EqualizerRack1_" + this.currentDeck + "_Effect1]",
    inKey: "parameter3",
  });

  this.mid = new components.Pot({
    group: "[EqualizerRack1_" + this.currentDeck + "_Effect1]",
    inKey: "parameter2",
  });

  this.bass = new components.Pot({
    group: "[EqualizerRack1_" + this.currentDeck + "_Effect1]",
    inKey: "parameter1",
  });

  this.filter = new components.Pot({
    group: "[QuickEffectRack1_" + this.currentDeck + "]",
    inKey: "super1",
  });

  this.gain = new components.Pot({
    inKey: "pregain",
  });

  this.pitch = new components.Pot({
    inKey: "rate",
    invert: true,
  });

  this.padSection = new MixtrackPlatinumFXLegacy.PadSection(number);

  this.loop = new components.Button({
    outKey: "loop_enabled",
    midi: [0x94 + channel, 0x40],
    input: function (channel, control, value, status, group) {
      if (!this.isPress(channel, control, value)) {
        return;
      }

      if (!MixtrackPlatinumFXLegacy.shifted) {
        if (engine.getValue(group, "loop_enabled") === 0) {
          script.triggerControl(group, "beatloop_activate");
        } else {
          script.triggerControl(group, "beatlooproll_activate");
        }
      } else {
        if (engine.getValue(group, "loop_enabled") === 0) {
          script.triggerControl(group, "reloop_toggle");
        } else {
          script.triggerControl(group, "reloop_andstop");
        }
      }
    },
    shiftControl: true,
    sendShifted: true,
    shiftOffset: 0x01,
  });

  this.loopHalf = new components.Button({
    midi: [0x94 + channel, 0x34],
    shiftControl: true,
    sendShifted: true,
    shiftOffset: 0x02,
    shift: function () {
      this.disconnect();
      this.inKey = "loop_in";
      this.outKey = "loop_in";
      this.connect();
      this.trigger();
    },
    unshift: function () {
      this.disconnect();
      this.inKey = "loop_halve";
      this.outKey = "loop_halve";
      this.connect();
      this.trigger();
    },
  });

  this.loopDouble = new components.Button({
    midi: [0x94 + channel, 0x35],
    shiftControl: true,
    sendShifted: true,
    shiftOffset: 0x02,
    shift: function () {
      this.disconnect();
      this.inKey = "loop_out";
      this.outKey = "loop_out";
      this.connect();
      this.trigger();
    },
    unshift: function () {
      this.disconnect();
      this.inKey = "loop_double";
      this.outKey = "loop_double";
      this.connect();
      this.trigger();
    },
  });

  this.scratchToggle = new components.Button({
    //         disconnects/connects are needed for the following scenario:
    //         1. scratch mode is enabled (light on)
    //         2. shift down
    //         3. scratch button down
    //         4. shift up
    //         5. scratch button up
    //         scratch mode light is now off, should be on
    key: "reverseroll",
    midi: [0x90 + channel, 0x07],
    unshift: function () {
      this.disconnect(); // disconnect reverseroll light
      this.input = function (channel, control, value) {
        if (!this.isPress(channel, control, value)) {
          return;
        }
        deck.scratchModeEnabled = !deck.scratchModeEnabled;

        // change the scratch mode status light
        this.send(deck.scratchModeEnabled ? this.on : this.off);
      };
      // set current scratch mode status light
      this.send(deck.scratchModeEnabled ? this.on : this.off);
    },
    sendShifted: false,
  });

  this.pitchBendUp = new components.Button({
    shiftControl: true,
    shiftOffset: 0x20,
    shift: function () {
      this.type = components.Button.prototype.types.toggle;
      this.inKey = "keylock";
    },
    unshift: function () {
      this.type = components.Button.prototype.types.push;
      this.inKey = "rate_temp_up";
    },
  });

  this.pitchBendDown = new components.Button({
    currentRangeIdx: 0,
    shift: function () {
      this.input = function (channel, control, value) {
        if (!this.isPress(channel, control, value)) {
          return;
        }
        this.currentRangeIdx =
          (this.currentRangeIdx + 1) %
          MixtrackPlatinumFXLegacy.pitchRanges.length;
        MixtrackPlatinumFXLegacy.updateRateRange(
          channel,
          this.group,
          MixtrackPlatinumFXLegacy.pitchRanges[this.currentRangeIdx],
        );
      };
    },
    unshift: function () {
      this.inKey = "rate_temp_down";
      this.input = components.Button.prototype.input;
    },
  });

  this.setBeatgrid = new components.Button({
    key: "beats_translate_curpos",
    midi: [0x98 + channel, 0x01 + channel * 3],
  });

  this.reconnectComponents(function (component) {
    if (component.group === undefined) {
      component.group = this.currentDeck;
    }
  });
};

MixtrackPlatinumFXLegacy.Deck.prototype = new components.Deck();

MixtrackPlatinumFXLegacy.PadSection = function (deckNumber) {
  components.ComponentContainer.call(this);

  this.blinkTimer = 0;

  this.longPressTimer = 0;
  this.longPressMode = 0;
  this.longPressHeld = false;

  // initialize leds
  var ledOff = components.Button.prototype.off;
  var ledOn = components.Button.prototype.on;
  midi.sendShortMsg(0x93 + deckNumber, 0x00, ledOn); // hotcue
  midi.sendShortMsg(0x93 + deckNumber, 0x0d, ledOff); // auto loop
  midi.sendShortMsg(0x93 + deckNumber, 0x07, ledOff); // "fader cuts"
  midi.sendShortMsg(0x93 + deckNumber, 0x0b, ledOff); // sample1

  // shifted leds
  midi.sendShortMsg(0x93 + deckNumber, 0x0f, ledOff); // sample2
  midi.sendShortMsg(0x93 + deckNumber, 0x02, ledOff); // beatjump

  this.modes = {};
  this.modes[MixtrackPlatinumFXLegacy.PadModeControls.HOTCUE] =
    new MixtrackPlatinumFXLegacy.ModeHotcue(deckNumber, false);
  this.modes[MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP] =
    new MixtrackPlatinumFXLegacy.ModeAutoLoop(deckNumber, false);
  this.modes[MixtrackPlatinumFXLegacy.PadModeControls.FADERCUTS] =
    new MixtrackPlatinumFXLegacy.ModeFaderCuts(deckNumber, false);
  this.modes[MixtrackPlatinumFXLegacy.PadModeControls.FADERCUTS2] =
    new MixtrackPlatinumFXLegacy.ModeFaderCuts(deckNumber, 1);
  this.modes[MixtrackPlatinumFXLegacy.PadModeControls.FADERCUTS3] =
    new MixtrackPlatinumFXLegacy.ModeFaderCuts(deckNumber, 2);
  this.modes[MixtrackPlatinumFXLegacy.PadModeControls.SAMPLE1] =
    new MixtrackPlatinumFXLegacy.ModeSample(deckNumber, false);
  this.modes[MixtrackPlatinumFXLegacy.PadModeControls.BEATJUMP] =
    new MixtrackPlatinumFXLegacy.ModeBeatjump(deckNumber, 2);
  this.modes[MixtrackPlatinumFXLegacy.PadModeControls.SAMPLE2] =
    new MixtrackPlatinumFXLegacy.ModeSample(deckNumber, 1);
  this.modes[MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP2] =
    new MixtrackPlatinumFXLegacy.ModeAutoLoop(deckNumber, 1);
  this.modes[MixtrackPlatinumFXLegacy.PadModeControls.KEYPLAY] =
    new MixtrackPlatinumFXLegacy.ModeKeyPlay(deckNumber, 2);
  this.modes[MixtrackPlatinumFXLegacy.PadModeControls.HOTCUE2] =
    new MixtrackPlatinumFXLegacy.ModeHotcue(deckNumber, 1);
  this.modes[MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP3] =
    new MixtrackPlatinumFXLegacy.ModeCueLoop(deckNumber, 2);

  this.modeButtonPress = function (channel, control, value) {
    // always stop the time, its either the off, which should stop it
    // or another button has been pressed, so thats now the "focus"
    if (this.longPressTimer !== 0) {
      // release button, leave the timer going, but mark as not held so it won't go off (still using it for double press)
      this.longPressHeld = false;
      if (value == 0x7f) {
        engine.stopTimer(this.longPressTimer);
        // there was a time, see if its for this button, if it is then this is a double press so active the same as if it has been a long press
        // cancel the timer eitherway
        if (
          control == MixtrackPlatinumFXLegacy.PadModeControls.SAMPLE1 &&
          this.longPressMode == MixtrackPlatinumFXLegacy.PadModeControls.KEYPLAY
        ) {
          this.setMode(channel, this.longPressMode);
          this.longPressTimer = 0;
          return;
        }
        if (
          control == MixtrackPlatinumFXLegacy.PadModeControls.HOTCUE &&
          this.longPressMode ==
            MixtrackPlatinumFXLegacy.PadModeControls.BEATJUMP
        ) {
          this.setMode(channel, this.longPressMode);
          this.longPressTimer = 0;
          return;
        }
        if (
          control == MixtrackPlatinumFXLegacy.PadModeControls.FADERCUTS &&
          this.longPressMode ==
            MixtrackPlatinumFXLegacy.PadModeControls.FADERCUTS3
        ) {
          this.setMode(channel, this.longPressMode);
          this.longPressTimer = 0;
          return;
        }
        if (
          control == MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP &&
          this.longPressMode ==
            MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP3
        ) {
          this.setMode(channel, this.longPressMode);
          this.longPressTimer = 0;
          return;
        }
        this.longPressTimer = 0;
      }
    }

    if (value !== 0x7f) {
      return;
    }
    this.setMode(channel, control);
  };

  this.padPress = function (channel, control, value, status, group) {
    var i = (control - 0x14) % 8;
    this.currentMode.pads[i].input(channel, control, value, status, group);
  };

  this.setMode = function (channel, control) {
    var ctrl2 = control;
    if (
      ctrl2 == MixtrackPlatinumFXLegacy.PadModeControls.SAMPLE2 &&
      this.currentMode.name == MixtrackPlatinumFXLegacy.PadModeControls.KEYPLAY
    ) {
      // this specific case we aren't setting a mode, we change the parameter for pitch play start
      this.currentMode.nextRange();
      return;
    }
    // The mixer doesn't consider these to have shift, so we have to make it up by looking at shift and the original key
    if (
      ctrl2 == MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP &&
      MixtrackPlatinumFXLegacy.shifted
    ) {
      ctrl2 = MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP2;
    }
    if (
      ctrl2 == MixtrackPlatinumFXLegacy.PadModeControls.FADERCUTS &&
      MixtrackPlatinumFXLegacy.shifted
    ) {
      ctrl2 = MixtrackPlatinumFXLegacy.PadModeControls.FADERCUTS2;
    }

    // this stops the timeout from setting another timer!
    if (this.longPressTimer === 0) {
      if (
        ctrl2 == MixtrackPlatinumFXLegacy.PadModeControls.SAMPLE1 ||
        ctrl2 == MixtrackPlatinumFXLegacy.PadModeControls.HOTCUE ||
        ctrl2 == MixtrackPlatinumFXLegacy.PadModeControls.FADERCUTS ||
        ctrl2 == MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP
      ) {
        if (ctrl2 == MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP) {
          this.longPressMode =
            MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP3;
        }
        if (ctrl2 == MixtrackPlatinumFXLegacy.PadModeControls.SAMPLE1) {
          this.longPressMode = MixtrackPlatinumFXLegacy.PadModeControls.KEYPLAY;
        }
        if (ctrl2 == MixtrackPlatinumFXLegacy.PadModeControls.HOTCUE) {
          this.longPressMode =
            MixtrackPlatinumFXLegacy.PadModeControls.BEATJUMP;
        }
        if (ctrl2 == MixtrackPlatinumFXLegacy.PadModeControls.FADERCUTS) {
          this.longPressMode =
            MixtrackPlatinumFXLegacy.PadModeControls.FADERCUTS3;
        }
        this.longPressHeld = true;
        this.longPressTimer = engine.beginTimer(
          components.Button.prototype.longPressTimeout * 2,
          function () {
            if (this.longPressHeld) {
              this.setMode(channel, this.longPressMode);
            }
            this.longPressTimer = 0;
            this.longPressHeld = false;
          },
          true,
        );
      }
    }

    var newMode = this.modes[ctrl2];
    if (
      this.currentMode.control === newMode.control &&
      this.currentMode.secondaryMode === newMode.secondaryMode
    ) {
      return; // selected mode already set, no need to change anything
    }

    this.currentMode.forEachComponent(function (component) {
      component.disconnect();
    });

    // set the correct shift state for new mode
    if (this.isShifted) {
      newMode.shift();
    } else {
      newMode.unshift();
    }

    newMode.forEachComponent(function (component) {
      component.connect();
      component.trigger();
    });
    if (newMode.activate) {
      newMode.activate();
    }

    if (MixtrackPlatinumFXLegacy.enableBlink) {
      // stop blinking if old mode was secondary mode
      if (this.currentMode.secondaryMode) {
        this.blinkLedOff();

        // disable light on the old control in case it ended up in 0x7F state
        midi.sendShortMsg(
          0x90 + channel,
          this.currentMode.unshiftedControl,
          0x01,
        );
      }

      // start blinking if new mode is a secondary mode
      if (newMode.secondaryMode) {
        this.blinkLedOn(
          0x90 + channel,
          newMode.unshiftedControl,
          newMode.lightOnValue,
          newMode.secondaryMode,
        );
      }
    }

    // light off on old mode select button
    midi.sendShortMsg(0x90 + channel, this.currentMode.control, 0x01);

    // light on on new mode select button
    midi.sendShortMsg(0x90 + channel, newMode.control, newMode.lightOnValue);

    this.currentMode = newMode;
  };

  // start an infinite timer that toggles led state
  this.blinkLedOn = function (midi1, midi2, onVal, secondMode) {
    this.blinkLedOff();
    this.blinkTimer = MixtrackPlatinumFXLegacy.BlinkStart(function (isOn) {
      midi.sendShortMsg(midi1, midi2, isOn ? onVal : 0x01);
    }, secondMode !== 2);
  };

  // stop the blink timer
  this.blinkLedOff = function () {
    if (this.blinkTimer === 0) {
      return;
    }

    MixtrackPlatinumFXLegacy.BlinkStop(this.blinkTimer);
    this.blinkTimer = 0;
  };

  this.disablePadLights = function () {
    for (var i = 0; i < 16; i++) {
      // 0-7 = unshifted; 8-15 = shifted
      midi.sendShortMsg(0x93 + deckNumber, 0x14 + i, 0x01);
    }
  };

  this.currentMode =
    this.modes[MixtrackPlatinumFXLegacy.PadModeControls.HOTCUE];
};
MixtrackPlatinumFXLegacy.PadSection.prototype = Object.create(
  components.ComponentContainer.prototype,
);

MixtrackPlatinumFXLegacy.ModeHotcue = function (deckNumber, secondaryMode) {
  components.ComponentContainer.call(this);

  this.control = MixtrackPlatinumFXLegacy.PadModeControls.HOTCUE;
  this.unshiftedControl = MixtrackPlatinumFXLegacy.PadModeControls.HOTCUE;
  this.secondaryMode = secondaryMode;
  this.lightOnValue = 0x7f;

  this.name = MixtrackPlatinumFXLegacy.PadModeControls.HOTCUE;
  var offset = 0;
  if (secondaryMode == 1) {
    this.name = MixtrackPlatinumFXLegacy.PadModeControls.HOTCUE2;
    this.control = MixtrackPlatinumFXLegacy.PadModeControls.HOTCUE2;
    offset = 8;
  }
  this.pads = new components.ComponentContainer();
  for (var i = 0; i < 8; i++) {
    this.pads[i] = new components.HotcueButton({
      group: "[Channel" + deckNumber + "]",
      midi: [0x93 + deckNumber, 0x14 + i],
      number: i + 1 + offset,
      shiftControl: true,
      sendShifted: true,
      shiftOffset: 0x08,
      outConnect: false,
    });
  }
};
MixtrackPlatinumFXLegacy.ModeHotcue.prototype = Object.create(
  components.ComponentContainer.prototype,
);

MixtrackPlatinumFXLegacy.ModeAutoLoop = function (deckNumber, secondaryMode) {
  components.ComponentContainer.call(this);

  this.name = MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP;
  if (secondaryMode) {
    this.name = MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP2;
  }
  this.control = MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP;
  this.unshiftedControl = MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP;
  this.secondaryMode = secondaryMode;
  this.lightOnValue = 0x7f;

  this.pads = new components.ComponentContainer();
  for (var i = 0; i < 8; i++) {
    this.pads[i] = new components.Button({
      group: "[Channel" + deckNumber + "]",
      midi: [0x93 + deckNumber, 0x14 + i],
      size: MixtrackPlatinumFXLegacy.autoLoopSizes[i],
      shiftControl: true,
      sendShifted: true,
      shiftOffset: 0x08,
      shift: function () {
        if (!secondaryMode) {
          this.inKey = "beatlooproll_" + this.size + "_activate";
          this.outKey = "beatlooproll_" + this.size + "_activate";
        } else {
          this.inKey = "beatloop_" + this.size + "_toggle";
          this.outKey = "beatloop_" + this.size + "_enabled";
        }
      },
      unshift: function () {
        if (!secondaryMode) {
          this.inKey = "beatloop_" + this.size + "_toggle";
          this.outKey = "beatloop_" + this.size + "_enabled";
        } else {
          this.inKey = "beatlooproll_" + this.size + "_activate";
          this.outKey = "beatlooproll_" + this.size + "_activate";
        }
      },
      outConnect: false,
    });
  }
};
MixtrackPlatinumFXLegacy.ModeAutoLoop.prototype = Object.create(
  components.ComponentContainer.prototype,
);

MixtrackPlatinumFXLegacy.ModeCueLoop = function (deckNumber, secondaryMode) {
  components.ComponentContainer.call(this);

  this.name = MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP;
  if (secondaryMode) {
    this.name = MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP3;
  }
  this.control = MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP;
  this.unshiftedControl = MixtrackPlatinumFXLegacy.PadModeControls.AUTOLOOP;
  this.secondaryMode = secondaryMode;
  this.lightOnValue = 0x7f;

  this.pads = new components.ComponentContainer();
  for (var i = 0; i < 8; i++) {
    this.pads[i] = new components.Button({
      group: "[Channel" + deckNumber + "]",
      midi: [0x93 + deckNumber, 0x14 + i],
      size: MixtrackPlatinumFXLegacy.autoLoopSizes[i],
      shiftControl: true,
      sendShifted: true,
      shiftOffset: 0x08,
      keynum: i,
      shift: function () {
        this.input = function (channel, control, value, status, _group) {
          engine.setValue(this.group, "slip_enabled", value);
          engine.setValue(
            this.group,
            "hotcue_" + (this.keynum + 1) + "_activate",
            value,
          );
          engine.setValue(this.group, "beatlooproll_activate", value);
          midi.sendShortMsg(
            this.midi[0],
            this.midi[1] + this.shiftOffset,
            this.outValueScale(
              engine.getValue(
                this.group,
                "hotcue_" + (this.keynum + 1) + "_enabled",
              ),
            ),
          );
        };
        midi.sendShortMsg(
          this.midi[0],
          this.midi[1] + this.shiftOffset,
          this.outValueScale(
            engine.getValue(
              this.group,
              "hotcue_" + (this.keynum + 1) + "_enabled",
            ),
          ),
        );
      },
      unshift: function () {
        this.input = function (channel, control, value, status, _group) {
          if (value > 0) {
            engine.setValue(
              this.group,
              "hotcue_" + (this.keynum + 1) + "_activate",
              value,
            );
            script.triggerControl(this.group, "beatloop_activate");
          } else {
            engine.setValue(
              this.group,
              "hotcue_" + (this.keynum + 1) + "_activate",
              value,
            );
          }
          midi.sendShortMsg(
            this.midi[0],
            this.midi[1],
            this.outValueScale(
              engine.getValue(
                this.group,
                "hotcue_" + (this.keynum + 1) + "_enabled",
              ),
            ),
          );
        };
        midi.sendShortMsg(
          this.midi[0],
          this.midi[1],
          this.outValueScale(
            engine.getValue(
              this.group,
              "hotcue_" + (this.keynum + 1) + "_enabled",
            ),
          ),
        );
      },
      outConnect: false,
    });
  }
};
MixtrackPlatinumFXLegacy.ModeCueLoop.prototype = Object.create(
  components.ComponentContainer.prototype,
);

MixtrackPlatinumFXLegacy.mykey = 0;
MixtrackPlatinumFXLegacy.ModeKeyPlay = function (deckNumber, secondaryMode) {
  components.ComponentContainer.call(this);

  this.name = MixtrackPlatinumFXLegacy.PadModeControls.KEYPLAY;
  this.control = MixtrackPlatinumFXLegacy.PadModeControls.SAMPLE1;
  this.unshiftedControl = MixtrackPlatinumFXLegacy.PadModeControls.SAMPLE1;
  this.secondaryMode = secondaryMode;
  this.lightOnValue = 0x7f;

  this.nextRange = function () {
    switch (this.pads.keyshiftStart) {
      case 0:
        this.pads.keyshiftStart = 4;
        break;
      case 4:
        this.pads.keyshiftStart = 7;
        break;
      case 7:
        this.pads.keyshiftStart = 0;
        break;
      default:
        this.pads.keyshiftStart = 4;
        break;
    }
  };

  this.pads = new components.ComponentContainer();
  var parentPads_ = this.pads;
  this.pads.cueP = 1;
  this.pads.keyshiftStart = 4;
  for (var i = 0; i < 8; i++) {
    this.pads[i] = new components.Button({
      parentPads: parentPads_,
      group: "[Channel" + deckNumber + "]",
      midi: [0x93 + deckNumber, 0x14 + i],
      shiftOffset: 0x08,
      keynum: i,
      shift: function () {
        this.input = function (channel, control, value, status, _group) {
          if (value > 0) {
            this.parentPads.cueP = this.keynum + 1;
          }
        };
        this.off = components.Button.prototype.off;
        midi.sendShortMsg(
          this.midi[0],
          this.midi[1] + this.shiftOffset,
          this.outValueScale(
            engine.getValue(
              this.group,
              "hotcue_" + (this.keynum + 1) + "_enabled",
            ),
          ),
        );
      },
      unshift: function () {
        // serato has them the oposite way to how I'd expect so shift the two rows around
        var thiskeynum = (this.keynum + 4) % 8;
        this.thiskey = thiskeynum - this.parentPads.keyshiftStart;
        this.input = function (channel, control, value, status, _group) {
          if (value > 0) {
            engine.setValue(this.group, "pitch_adjust", this.thiskey);
            MixtrackPlatinumFXLegacy.mykey = this.keynum;
            this.parentPads.forEachComponent(function (apad) {
              apad.output(0);
            });
            this.output(value);
          } else {
            if (this.keynum == MixtrackPlatinumFXLegacy.mykey) {
              //engine.setValue(this.group,"key",engine.getValue(this.group,"file_key"));
            }
          }
          engine.setValue(
            this.group,
            "hotcue_" + this.parentPads.cueP + "_activate",
            value,
          );
        };
        this.off =
          thiskeynum == this.parentPads.keyshiftStart
            ? 5
            : components.Button.prototype.off;
        if (engine.getValue(this.group, "pitch_adjust") == this.thiskey) {
          this.output(0x7f);
        } else {
          this.output(0);
        }
      },
      trigger: function () {
        this.output(0);
      },
    });
  }
};
MixtrackPlatinumFXLegacy.ModeKeyPlay.prototype = Object.create(
  components.ComponentContainer.prototype,
);

// when pads are in "fader cuts" mode, they rapidly move the crossfader.
// holding a pad activates a "fader cut", releasing it causes the GUI crossfader
// to return to the position of physical crossfader
MixtrackPlatinumFXLegacy.ModeFaderCuts = function (deckNumber, secondaryMode) {
  components.ComponentContainer.call(this);

  this.name = MixtrackPlatinumFXLegacy.PadModeControls.FADERCUTS;
  if (secondaryMode == 1) {
    this.name = MixtrackPlatinumFXLegacy.PadModeControls.FADERCUTS2;
  }
  if (secondaryMode == 2) {
    this.name = MixtrackPlatinumFXLegacy.PadModeControls.FADERCUTS3;
  }
  this.control = MixtrackPlatinumFXLegacy.PadModeControls.FADERCUTS;
  this.unshiftedControl = MixtrackPlatinumFXLegacy.PadModeControls.FADERCUTS;
  this.secondaryMode = secondaryMode;
  this.lightOnValue = 0x09; // for "fader cuts" 0x09 works better than 0x7F for some reason (0x7F turns the other lamps to a bit brighter)

  this.activate = function () {
    if (this.secondaryMode == 1) {
      midi.sendSysexMsg(
        MixtrackPlatinumFXLegacy.faderCutSysex8,
        MixtrackPlatinumFXLegacy.faderCutSysex8.length,
      );
    } else {
      midi.sendSysexMsg(
        MixtrackPlatinumFXLegacy.faderCutSysex4,
        MixtrackPlatinumFXLegacy.faderCutSysex4.length,
      );
    }
  };

  // fadercut pads are controlled by hardware of firmware in this mode
  var numFader = 4;
  if (secondaryMode == 1) {
    numFader = 8;
  }
  this.pads = new components.ComponentContainer();
  var i;
  for (i = 0; i < numFader; i++) {
    this.pads[i] = new components.Button({
      group: "[Channel" + deckNumber + "]",
      midi: [0x93 + deckNumber, 0x14 + i],
      input: function (channel, control, value, status, _group) {
        this.output(value);
      },
      trigger: function () {
        // in "fader cuts" mode pad lights need to be disabled manually,
        // as pads are controlled by hardware or firmware in this mode
        // and don't have associated controls. without this, lights from
        // previously selected mode would still be on after changing mode
        // to "fader cuts"
        this.output(0);
      },
      outConnect: false,
    });
  }
  if (secondaryMode == false) {
    i = 4;
    this.pads[i] = new components.Button({
      group: "[Channel" + deckNumber + "]",
      midi: [0x93 + deckNumber, 0x14 + i],
      key: "play_stutter",
      outConnect: false,
    });
    i++;
    this.pads[i] = new components.Button({
      group: "[Channel" + deckNumber + "]",
      midi: [0x93 + deckNumber, 0x14 + i],
      key: "start",
      outConnect: false,
    });
    i++;
    this.pads[i] = new components.Button({
      group: "[Channel" + deckNumber + "]",
      midi: [0x93 + deckNumber, 0x14 + i],
      key: "back",
      outConnect: false,
    });
    i++;
    this.pads[i] = new components.Button({
      group: "[Channel" + deckNumber + "]",
      midi: [0x93 + deckNumber, 0x14 + i],
      key: "fwd",
      outConnect: false,
    });
  }
  if (secondaryMode == 2) {
    i = 4;
    this.pads[i] = new components.Button({
      group: "[Channel" + deckNumber + "]",
      midi: [0x93 + deckNumber, 0x14 + i],
      key: "reverseroll",
      outConnect: false,
    });
    i++;
    this.pads[i] = new components.Button({
      type: 2,
      group: "[Channel" + deckNumber + "]",
      midi: [0x93 + deckNumber, 0x14 + i],
      key: "reverse",
      outConnect: false,
    });
    i++;
    this.pads[i] = new components.Button({
      group: "[Channel" + deckNumber + "]",
      midi: [0x93 + deckNumber, 0x14 + i],
      shift: function () {
        this.disconnect();
        this.inKey = "reset_key";
        this.outKey = "reset_key";
      },
      unshift: function () {
        this.disconnect();
        this.inKey = "sync_key";
        this.outKey = "sync_key";
      },
      outConnect: false,
    });
    i++;
    this.pads[i] = new components.Button({
      group: "[Channel" + deckNumber + "]",
      midi: [0x93 + deckNumber, 0x14 + i],
      outConnect: false,
      unshift: function () {
        this.disconnect();
        this.input = function (channel, control, value, _status, _group) {
          if (value > 0) {
            var prelen = bpm.tap.length;
            var predelta = bpm.previousTapDelta;
            bpm.tapButton(deckNumber);
            // if the array reset, or changed then the tap was "accepted"
            if (
              bpm.tap.length == 0 ||
              bpm.tap.length != prelen ||
              predelta != bpm.previousTapDelta
            ) {
              this.send(this.outValueScale(value));
            } else {
              this.send(0);
            }
          } else {
            this.send(this.outValueScale(value));
          }
        };
      },
      shift: function () {
        // reset rate to 0 (i.e. no tempo change)
        this.disconnect();
        this.input = function (channel, control, value, _status, _group) {
          if (value > 0) {
            engine.setValue(this.group, "rate", 0);
          }
        };
      },
    });
  }
};
MixtrackPlatinumFXLegacy.ModeFaderCuts.prototype = Object.create(
  components.ComponentContainer.prototype,
);

MixtrackPlatinumFXLegacy.ModeSample = function (deckNumber, secondaryMode) {
  components.ComponentContainer.call(this);

  if (!secondaryMode) {
    // samples 1-8
    this.name = MixtrackPlatinumFXLegacy.PadModeControls.SAMPLE1;
    this.control = MixtrackPlatinumFXLegacy.PadModeControls.SAMPLE1;
    this.firstSampleNumber = 1;
  } else {
    // samples 9-16
    this.name = MixtrackPlatinumFXLegacy.PadModeControls.SAMPLE2;
    this.control = MixtrackPlatinumFXLegacy.PadModeControls.SAMPLE2;
    this.unshiftedControl = MixtrackPlatinumFXLegacy.PadModeControls.SAMPLE1;
    this.firstSampleNumber = 9;
  }
  this.secondaryMode = secondaryMode;
  this.lightOnValue = 0x7f;

  this.pads = new components.ComponentContainer();
  for (var i = 0; i < 8; i++) {
    this.pads[i] = new components.SamplerButton({
      midi: [0x93 + deckNumber, 0x14 + i],
      number: this.firstSampleNumber + i,
      shiftControl: true,
      sendShifted: true,
      shiftOffset: 0x08,
      outConnect: false,
      loaded: 0x05,
      looping: 0x0f,
      playing: 0x0f,
    });
  }
};
MixtrackPlatinumFXLegacy.ModeSample.prototype = Object.create(
  components.ComponentContainer.prototype,
);

MixtrackPlatinumFXLegacy.ModeBeatjump = function (deckNumber, secondaryMode) {
  components.ComponentContainer.call(this);

  this.name = MixtrackPlatinumFXLegacy.PadModeControls.BEATJUMP;
  this.control = MixtrackPlatinumFXLegacy.PadModeControls.HOTCUE;
  this.secondaryMode = secondaryMode;
  this.unshiftedControl = MixtrackPlatinumFXLegacy.PadModeControls.HOTCUE;
  this.lightOnValue = 0x7f;

  this.pads = new components.ComponentContainer();
  for (var i = 0; i < 8; i++) {
    this.pads[i] = new components.Button({
      group: "[Channel" + deckNumber + "]",
      midi: [0x93 + deckNumber, 0x14 + i],
      size: MixtrackPlatinumFXLegacy.beatJumpValues[i],
      shiftControl: true,
      sendShifted: true,
      shiftOffset: 0x08,
      shift: function () {
        this.disconnect();
        this.inKey = "beatjump_" + this.size + "backward";
        this.outKey = "beatjump_" + this.size + "backward";
        this.connect();
        this.trigger();
      },
      unshift: function () {
        this.disconnect();
        this.inKey = "beatjump_" + this.size + "forward";
        this.outKey = "beatjump_" + this.size + "forward";
        this.connect();
        this.trigger();
      },
      outConnect: false,
    });
  }
};
MixtrackPlatinumFXLegacy.ModeBeatjump.prototype = Object.create(
  components.ComponentContainer.prototype,
);

MixtrackPlatinumFXLegacy.Browse = function () {
  this.knob = new components.Encoder({
    speed: 0,
    speedTimer: 0,
    shiftControl: true,
    shiftOffset: 0x01,
    input: function (channel, control, value) {
      var direction;
      if (
        MixtrackPlatinumFXLegacy.shifted &&
        MixtrackPlatinumFXLegacy.shifBrowseIsZoom
      ) {
        direction = value > 0x40 ? "up" : "down";
        engine.setParameter("[Channel1]", "waveform_zoom_" + direction, 1);

        // need to zoom both channels if waveform sync is disabled in Mixxx settings.
        // and when it's enabled then no need to zoom 2nd channel, as it will cause
        // the zoom to jump 2 levels at once
        if (!MixtrackPlatinumFXLegacy.waveformsSynced) {
          engine.setParameter("[Channel2]", "waveform_zoom_" + direction, 1);
        }
      } else {
        if (this.speedTimer !== 0) {
          engine.stopTimer(this.speedTimer);
          this.speedTimer = 0;
        }
        this.speedTimer = engine.beginTimer(
          100,
          function () {
            this.speed = 0;
            this.speedTimer = 0;
          }.bind(this),
          true,
        );
        this.speed++;
        direction = value > 0x40 ? value - 0x80 : value;
        if (MixtrackPlatinumFXLegacy.shifted) {
          // when shifted go fast (consecutive squared!)
          direction *= this.speed * this.speed;
        } else {
          // normal, up to 3 consecutive do one for fine control, then speed up
          if (this.speed > 3) direction *= Math.min(4, this.speed - 3);
        }
        engine.setParameter("[Library]", "MoveVertical", direction);
      }
    },
  });

  this.knobButton = new components.Button({
    group: "[Library]",
    shiftControl: true,
    shiftOffset: 0x01,
    previewing: false,
    shift: function () {
      this.inKey = "GoToItem";
      this.input = function (channel, control, value, _status, _group) {
        if (value > 0) {
          if (MixtrackPlatinumFXLegacy.rightShift) {
            if (this.previewing) {
              script.triggerControl("[PreviewDeck1]", "stop");
              this.previewing = false;
            } else {
              script.triggerControl(
                "[PreviewDeck1]",
                "LoadSelectedTrackAndPlay",
              );
              this.previewing = true;
            }
          } else {
            script.triggerControl("[Library]", "GoToItem");
          }
        }
      };
    },
    unshift: function () {
      this.input = components.Button.prototype.input;
      this.inKey = "MoveFocusForward";
    },
  });
};
MixtrackPlatinumFXLegacy.Browse.prototype = new components.ComponentContainer();

MixtrackPlatinumFXLegacy.Gains = function () {
  this.mainGain = new components.Pot({
    group: "[Master]",
    inKey: "gain",
  });

  this.cueGain = new components.Pot({
    group: "[Master]",
    inKey: "headGain",
    shift: function () {
      this.disconnect();
      this.group = "[Sampler1]";
      this.inKey = "pregain";
      this.input = function (channel, control, value, _status, _group) {
        var newValue = this.inValueScale(value);
        for (var i = 1; i <= 16; i++) {
          engine.setParameter("[Sampler" + i + "]", "pregain", newValue);
        }
      };
    },
    unshift: function () {
      this.disconnect();
      this.firstValueReceived = false;
      this.group = "[Master]";
      this.inKey = "headGain";
      this.input = components.Pot.prototype.input;
    },
  });

  this.cueMix = new components.Pot({
    group: "[Master]",
    inKey: "headMix",
  });
};
MixtrackPlatinumFXLegacy.Gains.prototype = new components.ComponentContainer();

MixtrackPlatinumFXLegacy.vuCallback = function (value, group) {
  var level = value * 90;
  var deckOffset = script.deckFromGroup(group) - 1;
  midi.sendShortMsg(0xb0 + deckOffset, 0x1f, level);
};

MixtrackPlatinumFXLegacy.wheelTouch = function (channel, control, value) {
  var deckNumber = channel + 1;

  if (
    !MixtrackPlatinumFXLegacy.shifted &&
    MixtrackPlatinumFXLegacy.deck[channel].scratchModeEnabled &&
    value === 0x7f
  ) {
    // touch start

    engine.scratchEnable(
      deckNumber,
      MixtrackPlatinumFXLegacy.jogScratchSensitivity,
      33 + 1 / 3,
      MixtrackPlatinumFXLegacy.jogScratchAlpha,
      MixtrackPlatinumFXLegacy.jogScratchBeta,
      true,
    );
  } else if (value === 0) {
    // touch end
    engine.scratchDisable(deckNumber, true);
  }
};

MixtrackPlatinumFXLegacy.wheelTurn = function (
  channel,
  control,
  value,
  status,
  group,
) {
  var deckNumber = channel + 1;

  var newValue = value;

  if (value >= 64) {
    // correct the value if going backwards
    newValue -= 128;
  }

  if (MixtrackPlatinumFXLegacy.shifted) {
    // seek
    var oldPos = engine.getValue(group, "playposition");

    engine.setValue(
      group,
      "playposition",
      oldPos + newValue / MixtrackPlatinumFXLegacy.jogSeekSensitivity,
    );
  } else if (
    MixtrackPlatinumFXLegacy.deck[channel].scratchModeEnabled &&
    engine.isScratching(deckNumber)
  ) {
    // scratch
    engine.scratchTick(deckNumber, newValue);
  } else {
    // pitch bend
    engine.setValue(
      group,
      "jog",
      newValue / MixtrackPlatinumFXLegacy.jogPitchSensitivity,
    );
  }
};

MixtrackPlatinumFXLegacy.timeElapsedCallback = function (
  value,
  group,
  control,
) {
  // 0 = elapsed
  // 1 = remaining
  // 2 = both (we ignore this as the controller can't show both)
  var on_off;
  if (value === 0) {
    // show elapsed
    on_off = 0x00;
  } else if (value === 1) {
    // show remaining
    on_off = 0x7f;
  } else {
    // both, ignore the event
    return;
  }

  // update all 4 decks on the controller
  midi.sendShortMsg(0x90, 0x46, on_off);
  midi.sendShortMsg(0x91, 0x46, on_off);
  midi.sendShortMsg(0x92, 0x46, on_off);
  midi.sendShortMsg(0x93, 0x46, on_off);
};

MixtrackPlatinumFXLegacy.timeMs = function (deck, position, duration) {
  return Math.round(duration * position * 1000);
};

MixtrackPlatinumFXLegacy.encodeNumToArray = function (number, drop, unsigned) {
  var number_array = [
    (number >> 28) & 0x0f,
    (number >> 24) & 0x0f,
    (number >> 20) & 0x0f,
    (number >> 16) & 0x0f,
    (number >> 12) & 0x0f,
    (number >> 8) & 0x0f,
    (number >> 4) & 0x0f,
    number & 0x0f,
  ];

  if (drop !== undefined) {
    number_array.splice(0, drop);
  }

  if (number < 0) number_array[0] = 0x07;
  else if (!unsigned) number_array[0] = 0x08;

  return number_array;
};

MixtrackPlatinumFXLegacy.sendScreenDurationMidi = function (deck, duration) {
  if (duration < 1) {
    duration = 1;
  }
  durationArray = MixtrackPlatinumFXLegacy.encodeNumToArray(duration - 1);

  var bytePrefix = [0xf0, 0x00, 0x20, 0x7f, deck, 0x03];
  var bytePostfix = [0xf7];
  var byteArray = bytePrefix.concat(durationArray, bytePostfix);
  midi.sendSysexMsg(byteArray, byteArray.length);
};

MixtrackPlatinumFXLegacy.sendScreenTimeMidi = function (deck, time) {
  var timeArray = MixtrackPlatinumFXLegacy.encodeNumToArray(time);

  var bytePrefix = [0xf0, 0x00, 0x20, 0x7f, deck, 0x04];
  var bytePostfix = [0xf7];
  var byteArray = bytePrefix.concat(timeArray, bytePostfix);
  midi.sendSysexMsg(byteArray, byteArray.length);
};

MixtrackPlatinumFXLegacy.sendScreenBpmMidi = function (deck, bpm) {
  bpmArray = MixtrackPlatinumFXLegacy.encodeNumToArray(bpm);
  bpmArray.shift();
  bpmArray.shift();

  var bytePrefix = [0xf0, 0x00, 0x20, 0x7f, deck, 0x01];
  var bytePostfix = [0xf7];
  var byteArray = bytePrefix.concat(bpmArray, bytePostfix);
  midi.sendSysexMsg(byteArray, byteArray.length);

  MixtrackPlatinumFXLegacy.updateArrows();
};

MixtrackPlatinumFXLegacy.rightShift = false;
MixtrackPlatinumFXLegacy.shiftToggle = function (
  channel,
  control,
  value,
  status,
  group,
) {
  if (value == 0x7f) {
    if (status == 0x91 || status == 0x93) {
      MixtrackPlatinumFXLegacy.rightShift = true;
    }
    MixtrackPlatinumFXLegacy.shift();
  } else {
    MixtrackPlatinumFXLegacy.rightShift = false;
    MixtrackPlatinumFXLegacy.unshift();
  }
};

MixtrackPlatinumFXLegacy.deckSwitch = function (
  channel,
  control,
  value,
  status,
  group,
) {
  // Ignore the release the deck switch callback
  // called both when actually releasing the button and for the alt deck when switching
  if (value) {
    var deck = channel;
    MixtrackPlatinumFXLegacy.deck[deck].setActive(value == 0x7f);
    // turn "off" the other deck
    // this can't reliably be done with the release as it also trigger for this deck when the button is released
    var other = 4 - deck;
    if (deck == 0 || deck == 2) other = 2 - deck;
    MixtrackPlatinumFXLegacy.deck[other].setActive(false);
    // also zero vu meters
    if (value == 0x7f) {
      midi.sendShortMsg(0xbf, 0x44, 0);
      midi.sendShortMsg(0xbf, 0x45, 0);
    }
    MixtrackPlatinumFXLegacy.updateArrows(true);
  }
};

var sendSysex = function (buffer) {
  midi.sendSysexMsg(buffer, buffer.length);
};

MixtrackPlatinumFXLegacy.sendScreenRateMidi = function (deck, rate) {
  rateArray = MixtrackPlatinumFXLegacy.encodeNumToArray(rate, 2);

  var bytePrefix = [0xf0, 0x00, 0x20, 0x7f, deck, 0x02];
  var bytePostfix = [0xf7];
  var byteArray = bytePrefix.concat(rateArray, bytePostfix);
  sendSysex(byteArray);
};

// arrow data state (and cache to prevent midi spam)
MixtrackPlatinumFXLegacy.arrowsData = {
  arrowsUpdateOn: true,
  uparrow: [0, 0, 0, 0],
  downarrow: [0, 0, 0, 0],
};

// force refresh turns arrow behaviour back to normal, and forces a refresh bypressing the cache
// force show turns both arrows on and suspends normal operation
MixtrackPlatinumFXLegacy.updateArrows = function (
  forceRefresh,
  forceShow,
  deck,
) {
  if (!MixtrackPlatinumFXLegacy.initComplete) {
    return;
  }

  if (forceShow) {
    // both arrows on to indicate the deck we are tapping
    midi.sendShortMsg(0x80 | deck, 0x0a, 1);
    midi.sendShortMsg(0x80 | deck, 0x09, 1);
    // and stop other updates changing them
    MixtrackPlatinumFXLegacy.arrowsData.arrowsUpdateOn = false;
  } else {
    if (forceRefresh) {
      MixtrackPlatinumFXLegacy.arrowsData.arrowsUpdateOn = true;
    }
    if (MixtrackPlatinumFXLegacy.arrowsData.arrowsUpdateOn) {
      var activeA = MixtrackPlatinumFXLegacy.deck[0].active ? 0 : 2;
      var activeB = MixtrackPlatinumFXLegacy.deck[1].active ? 1 : 3;

      var bpmA = engine.getValue("[Channel" + (activeA + 1) + "]", "bpm");
      var bpmB = engine.getValue("[Channel" + (activeB + 1) + "]", "bpm");

      var i;
      for (i = 0; i < 4; i++) {
        var bpmMy = engine.getValue("[Channel" + (i + 1) + "]", "bpm");
        var bpmAlt = bpmA;
        if (i == 0 || i == 2) {
          bpmAlt = bpmB;
        }

        var down = 0;
        var up = 0;

        // only display if both decks have a bpm
        if (bpmAlt && bpmMy) {
          // and have a 0.05 bpm tolerance (else they only go off when you use sync)
          if (bpmAlt > bpmMy + 0.05) {
            down = 1;
          }
          if (bpmAlt < bpmMy - 0.05) {
            up = 1;
          }
        }

        if (
          forceRefresh ||
          MixtrackPlatinumFXLegacy.arrowsData.downarrow[i] != down
        ) {
          MixtrackPlatinumFXLegacy.arrowsData.downarrow[i] = down;
          midi.sendShortMsg(0x80 | i, 0x0a, down); // down arrow update
        }
        if (
          forceRefresh ||
          MixtrackPlatinumFXLegacy.arrowsData.uparrow[i] != up
        ) {
          MixtrackPlatinumFXLegacy.arrowsData.uparrow[i] = up;
          midi.sendShortMsg(0x80 | i, 0x09, up); // up arrow update
        }
      }
    }
  }
};

MixtrackPlatinumFXLegacy.rateCallback = function (rate, group, control) {
  var channel = script.deckFromGroup(group) - 1;
  var rateEffective = engine.getValue(group, "rateRange") * -rate;

  MixtrackPlatinumFXLegacy.sendScreenRateMidi(
    channel + 1,
    Math.round(rateEffective * 10000),
  );
};

MixtrackPlatinumFXLegacy.updateRateRange = function (channel, group, range) {
  //engine.setParameter(group, "rateRange", (range-0.01)*0.25);
  engine.setValue(group, "rateRange", range);
  midi.sendShortMsg(0x90 + channel, 0x0e, range * 100);
};
