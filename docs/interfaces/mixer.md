# Mixer

Channel strips (×4), crossfader, master gain, and headphone section. All channel-strip controls are plain 7-bit Control Change values on the deck's CC channel (`0xB0-B3`).

## Channel strip (per deck)

| Control | Group | Status (deck 1→4) | Midino | Mixxx key |
|---|---|---|---|---|
| Gain | `[ChannelN]` | `0xB0-B3` | `0x16` | `deck[N].gain.input` → `pregain` |
| Treble | `[EqualizerRack1_[ChannelN]_Effect1]` | `0xB0-B3` | `0x17` | `deck[N].treble.input` → `parameter3` |
| Mid | `[EqualizerRack1_[ChannelN]_Effect1]` | `0xB0-B3` | `0x18` | `deck[N].mid.input` → `parameter2` |
| Bass | `[EqualizerRack1_[ChannelN]_Effect1]` | `0xB0-B3` | `0x19` | `deck[N].bass.input` → `parameter1` |
| Filter (QuickEffect) | `[QuickEffectRack1_[ChannelN]]` | `0xB0-B3` | `0x1A` | `deck[N].filter.input` → `super1` |
| Channel volume fader | `[ChannelN]` | `0xB0-B3` | `0x1C` | `deck[N].volume.input` → `volume` |

`N` = 0-3 (deck index), status = `0xB0 + N`.

## Crossfader

The crossfader has **two** `<control>` entries, because the 2nd-deck "fader cuts" pad mode rapidly toggles the crossfader across itself and needs its value inverted on the wire to land correctly:

| Entry | Group | Status | Midino | Option |
|---|---|---|---|---|
| Main crossfader (and deck-1 "fader cuts") | `[Master]` | `0xBF` | `0x08` | `<normal/>` — value passed straight through |
| Deck-2 "fader cuts" | `[Master]` | `0xB1` | `0x08` | `<invert/>` — value inverted before being applied |

Both write to the same Mixxx `crossfader` control.

## Master gain

| Control | Group | Status | Midino | Mixxx key |
|---|---|---|---|---|
| Main gain knob | `[Master]` | `0xBE` | `0x23` | `gains.mainGain.input` → `gain` |

## Headphone cue gain & mix

| Control | Group | Status | Midino | Mixxx key |
|---|---|---|---|---|
| Cue gain knob | `[Master]` | `0xBF` | `0x0C` | `gains.cueGain.input` → `headGain` |
| Cue mix knob | `[Master]` | `0xBF` | `0x0D` | `gains.cueMix.input` → `headMix` |

**Shift behavior (cue gain knob only):** while Shift is held, this knob is repurposed to set `pregain` on **all 16 Samplers simultaneously**, instead of controlling headphone gain. Released, it snaps back to `headGain`.

## Not present on this controller

Verified absent from both source files — do not assume these exist:
- No booth-volume knob.
- No crossfader curve/contour knob.
- No "split cue" control.
