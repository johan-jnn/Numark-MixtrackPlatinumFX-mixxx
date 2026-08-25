# Pad section

8 performance pads per deck, plus 4 mode-select buttons above them. All pad-section traffic (mode buttons and pads) lives on the **pad-page status range**: `0x94-97` (press) / `0x84-87` (release), i.e. base transport status **+4**, not the plain `0x90-93`/`0x80-83` range used by Play/Cue/Sync. See [README](README.md#how-shift-is-encoded) for Pattern A/B/C.

## Pad-mode select buttons

| Mode | Press | Release | Shift-press (wire) | Shift-release (wire) |
|---|---|---|---|---|
| Hotcue | `0x94-97 / 0x00` | `0x84-87 / 0x00` | `0x94-97 / 0x02` | `0x84-87 / 0x02` |
| Autoloop | `0x94-97 / 0x0D` | `0x84-87 / 0x0D` | *(none — see below)* | *(none)* |
| Fader Cuts | `0x94-97 / 0x07` | `0x84-87 / 0x07` | *(none — see below)* | *(none)* |
| Sample 1 | `0x94-97 / 0x0B` | `0x84-87 / 0x0B` | `0x94-97 / 0x0F` | `0x84-87 / 0x0F` |

> **⚠️ XML comment vs. actual behavior — Hotcue's "shift" code.** The XML file labels the `0x94-97 / 0x02` entry with the comment `<!-- Beatjump -->`. In the JS mapping, however, midino `0x02` is the constant `HOTCUE2`, and pressing it selects a **second bank of 8 hotcues (hotcues 9-16)** — not Beatjump mode. The `BEATJUMP` constant (`0x01`) exists in the code but has **no wire code at all**; Beatjump mode is only reachable by **long-pressing** the plain Hotcue button (see below). Treat the pad grid's actual behavior (this file + the JS `PadModeControls` table) as authoritative over the XML comment.

### Software-only "secondary" modes (no MIDI code of their own)

Autoloop and Fader Cuts have only **one** wire midino each (`0x0D` and `0x07`). Their "shifted" and "long-pressed" variants are *not* separate MIDI messages — the script detects the global Shift state, or times a long-press/double-press, when that same midino arrives, and switches to a different internal mode:

| Internal constant | Value | How it's reached | What it is |
|---|---|---|---|
| `HOTCUE` | `0x00` | Direct press | Hotcues 1-8 |
| `HOTCUE2` | `0x02` | Direct press *(shift+Hotcue on the wire)* | Hotcues 9-16 |
| `BEATJUMP` | `0x01` | **Long-press** of Hotcue | Beatjump pads |
| `AUTOLOOP` | `0x0D` | Direct press | Beatloop toggle/roll (sizes below) |
| `AUTOLOOP2` | `0x0E` | **Shift** + press of Autoloop (same midino `0x0D`) | Beatloop-roll variant |
| `AUTOLOOP3` ("CueLoop") | `0x05` | **Long-press** of Autoloop | Combined hotcue + loop-roll pads |
| `FADERCUTS` | `0x07` | Direct press | Hardware-lit fader-cut pads (see [`outputs.md`](outputs.md#fader-cuts-pad-count-sysex)) |
| `FADERCUTS2` | `0x03` | **Shift** + press of Fader Cuts (same midino `0x07`) | Alternate fader-cuts variant |
| `FADERCUTS3` | `0x04` | **Long-press** of Fader Cuts | Alternate fader-cuts variant |
| `SAMPLE1` | `0x0B` | Direct press | Samplers 1-8 |
| `SAMPLE2` | `0x0F` | Direct press *(shift+Sample1 on the wire)* | Samplers 9-16 |
| `KEYPLAY` | `0x0C` | **Long-press** (or double-press) of Sample1 | Pitch-play mode |

`SAMPLE2` pressed a second time *while already in `KEYPLAY`* doesn't switch modes — it cycles `KEYPLAY`'s pitch-shift start range instead (0 → 4 → 7 → 0 semitones).

Group: `[ChannelN]`. Key: `deck[N].padSection.modeButtonPress`.

## Pad grid (8 pads × 4 decks)

Status is **`0x94 + deckNumber`** where `deckNumber` = 1-4 (i.e. `0x94-97`, same range as the mode buttons — **not** `0x90+channel`). Shift adds **`+8`** to the midino; the status byte does not change (Pattern B).

| Pad # | Unshifted midino | Shifted midino |
|---|---|---|
| 1 | `0x14` | `0x1C` |
| 2 | `0x15` | `0x1D` |
| 3 | `0x16` | `0x1E` |
| 4 | `0x17` | `0x1F` |
| 5 | `0x18` | `0x20` |
| 6 | `0x19` | `0x21` |
| 7 | `0x1A` | `0x22` |
| 8 | `0x1B` | `0x23` |

Press = status `0x94-97`, release = status `0x84-87`, for both shifted and unshifted midinos. Key: `deck[N].padSection.padPress`.

Meaning of each pad depends on the currently active mode:

| Mode | Pad meaning |
|---|---|
| Hotcue / Hotcue2 | `hotcue_(pad#[+8])_activate` |
| Autoloop / Autoloop2 | Beatloop size per pad — sizes (beats): `1/16, 1/8, 1/4, 1/2, 1, 2, 4, 8` (pads 1-8). Unshifted = `beatloop_<size>_toggle`; shifted = `beatlooproll_<size>_activate` (swapped when Autoloop2/roll variant is active) |
| Beatjump | Beatjump size per pad: `1/16, 1/8, 1/4, 1/2, 1, 2, (GUI-selected default), 8` |
| Sample 1 / Sample 2 | Triggers Sampler 1-8 / 9-16 |
| Fader Cuts | Hardware/firmware-controlled — no Mixxx pad callback is bound; see [`outputs.md`](outputs.md#fader-cuts-pad-count-sysex) |

## LED behavior

- Brightness scheme is **single-color, two-level** (not RGB): `HIGH_LIGHT = 0x7F` (bright/on), `LOW_LIGHT = 0x01` (dim, used as "off" for every button in this mapping — buttons are never sent a true `0x00`).
- Mode-select LED switching: turning off the old mode sends `0x90+channel, <old control>, 0x01`; turning on the new mode sends `0x90+channel, <new control>, <lightOnValue>` (normally `0x7F`).
  - **Exception:** Fader Cuts mode uses `0x09` instead of `0x7F` as its "on" brightness — code comment notes `0x7F` makes the *other* lamps appear brighter than intended, so `0x09` was found to look correct.
- **Blinking** (for the software-only secondary modes reached by shift/long-press): a shared timer toggles at `blinkDelay/2` = 350 ms; "slow" blink variants only toggle on every other tick (i.e. ~700 ms).
- `disablePadLights()` sweeps the full pad range and dims every pad: `midi.sendShortMsg(0x93+deckNumber, control, 0x01)` for `control = 0x14..0x23` (all 16 midino values, unshifted + shifted).

See [`outputs.md`](outputs.md#pad-mode--pad-led-init) for the exact init-time LED sequence.
