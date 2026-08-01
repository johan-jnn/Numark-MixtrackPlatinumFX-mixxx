Object.assign(MixtrackPlatinumFX, {
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
    low: 0x7f,

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
});
