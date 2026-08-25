# Decks & transport

Covers per-deck transport buttons, pitch control, tap tempo, loops, scratch toggle, headphone cue, load, deck switch, and the physical Shift button. All ×4 tables use deck channel `n = 0-3` for decks 1-4 unless stated otherwise. See [README](README.md#how-shift-is-encoded) for the general Shift-encoding patterns referenced below (Pattern A/B/C).

## Play / Cue / Sync

All three follow **Pattern A**: same status per action (press/release), shifted variant uses a different midino on the same status.

| Button | Action | Status (deck 1→4) | Midino | Notes |
|---|---|---|---|---|
| Play | Press | `0x90-93` | `0x00` | |
| Play | Release | `0x80-83` | `0x00` | |
| Play | Shift-press | `0x90-93` | `0x04` | Key = `playButton_beatgrid`; sets `beats_translate_curpos` (moves the beatgrid to the current position) instead of toggling play |
| Play | Shift-release | `0x80-83` | `0x04` | |
| Cue | Press | `0x90-93` | `0x01` | |
| Cue | Release | `0x80-83` | `0x01` | |
| Cue | Shift-press | `0x90-93` | `0x05` | |
| Cue | Shift-release | `0x80-83` | `0x05` | |
| Sync | Press | `0x90-93` | `0x02` | |
| Sync | Release | `0x80-83` | `0x02` | |
| Sync | Shift-press | `0x90-93` | `0x03` | |
| Sync | Shift-release | `0x80-83` | `0x03` | |

Mixxx groups: `[Channel1]`…`[Channel4]`. Keys: `MixtrackPlatinumFX.deck[N].playButton.input` / `.cueButton.input` / `.syncButton.input` (`N` = 0-3).

## Pitch fader

14-bit value split across two 7-bit CC messages (MSB/LSB), status `0xB0-93` per deck:

| Element | Status | Midino |
|---|---|---|
| Pitch MSB | `0xB0-B3` | `0x09` |
| Pitch LSB | `0xB0-B3` | `0x29` |

Key: `deck[N].pitch.inputMSB` / `.inputLSB`.

## Pitch-bend buttons

**Pattern A** — shift changes the midino (base `+0x20`), status stays fixed:

| Button | Action | Status (deck 1→4) | Midino |
|---|---|---|---|
| Pitch bend down | Press | `0x90-93` | `0x0C` |
| Pitch bend down | Release | `0x80-83` | `0x0C` |
| Pitch bend down | Shift-press | `0x90-93` | `0x2C` |
| Pitch bend down | Shift-release | `0x80-83` | `0x2C` |
| Pitch bend up | Press | `0x90-93` | `0x0B` |
| Pitch bend up | Release | `0x80-83` | `0x0B` |
| Pitch bend up | Shift-press | `0x90-93` | `0x2B` |
| Pitch bend up | Shift-release | `0x80-83` | `0x2B` |

Behavior (from JS):
- **Unshifted:** Pitch bend down/up → temporary rate nudge (`rate_temp_down` / `rate_temp_up`, held-push behavior).
- **Shift + pitch bend down:** cycles the pitch-fader range through `[0.08, 0.16, 0.5]` (8%/16%/50%) — there is no dedicated "pitch range" button, this is it.
- **Shift + pitch bend up:** toggles **Keylock** (`keylock` control, toggle type). **This is the controller's only keylock control — there is no dedicated Keylock button.** Its state is reflected back via the Keylock LED (see [`outputs.md`](outputs.md#keylock-led)).

## Tap tempo

There is a single physical Tap button (near the FX section), but its keypress is broadcast on **two** different note channels; the mapping only acts on the first and explicitly ignores the second to avoid double-processing one physical press.

| Status | Midino | Behavior |
|---|---|---|
| `0x98` press / `0x88` release | `0x09` | Real tap-tempo logic (`bpm.tapButton`), targets whichever deck is currently "active for tap" (heuristic: playing + cued > playing > stopped > any loaded deck) |
| `0x99` press / `0x89` release | `0x09` | Bound but ignored (no-op) — the redundant second message from the same physical button |
| Shift + Tap | (same channel `0x98/0x88`) | Resets the target deck's `rate` to `0` (removes any tempo adjustment) instead of tapping |

Key: `deck[0].tap.input` (only deck 1's component implements the real logic; `deck[1..3].tap` are the no-op).

## `setBeatgrid`

| Deck | Status | Midino |
|---|---|---|
| 1 | `0x98` | `0x01` |
| 2 | `0x99` | `0x04` |
| 3 | `0x9A` | `0x07` |
| 4 | `0x9B` | `0x0A` |

(General formula from JS: status `0x98+channel`, midino `0x01 + channel*3`.) Key: `beats_translate_curpos`.

## Scratch toggle

Toggles whether touching the jog wheel engages scratch mode (see [`jog-wheels.md`](jog-wheels.md)) — it does **not** scratch by itself.

| Action | Status (deck 1→4) | Midino |
|---|---|---|
| Press | `0x90-93` | `0x07` |
| Release | `0x80-83` | `0x07` |

Key: `deck[N].scratchToggle.input`. LED reflects `deck.scratchModeEnabled` (on = scratch mode active).

## Headphone cue (PFL)

| Action | Status (deck 1→4) | Midino |
|---|---|---|
| Press | `0x90-93` | `0x1B` |
| Release | `0x80-83` | `0x1B` |

Key: `deck[N].pflButton.input`. Toggle-type button (`pfl` control). Shift remaps the same physical button to toggle **Slip Mode** (`slip_enabled`) instead of headphone cue.

## Load button

| Deck | Press status/midino | Release status/midino |
|---|---|---|
| 1 | `0x9F / 0x02` | `0x8F / 0x02` |
| 2 | `0x9F / 0x03` | `0x8F / 0x03` |
| 3 | `0x9F / 0x04` | `0x8F / 0x04` |
| 4 | `0x9F / 0x05` | `0x8F / 0x05` |

Key: `deck[N].loadButton.input` → `LoadSelectedTrack`. Shift → `eject` instead of loading.

## Loop buttons

**Pattern A** — same status, shift = distinct midino. Status is the pad-page range (`0x94-97`), not the plain transport range.

| Button | Action | Status (deck 1→4) | Midino |
|---|---|---|---|
| Loop in/out toggle | Press | `0x94-97` | `0x40` |
| Loop in/out toggle | Release | `0x84-87` | `0x40` |
| Loop in/out toggle | Shift-press | `0x94-97` | `0x41` |
| Loop in/out toggle | Shift-release | `0x84-87` | `0x41` |
| Loop ½ (halve) | Press | `0x94-97` | `0x34` |
| Loop ½ (halve) | Release | `0x84-87` | `0x34` |
| Loop ½ (halve) | Shift-press | `0x94-97` | `0x36` |
| Loop ½ (halve) | Shift-release | `0x84-87` | `0x36` |
| Loop ×2 (double) | Press | `0x94-97` | `0x35` |
| Loop ×2 (double) | Release | `0x84-87` | `0x35` |
| Loop ×2 (double) | Shift-press | `0x94-97` | `0x37` |
| Loop ×2 (double) | Shift-release | `0x84-87` | `0x37` |

Behavior:
- **Loop in/out (unshifted):** if no loop is active, `beatloop_activate`; if a loop is active, `beatlooproll_activate` (converts it to a roll).
- **Loop in/out (shifted):** if no loop is active, `reloop_toggle`; if a loop is active, `reloop_andstop`.
- **Loop ½ (unshifted):** `loop_halve`. **Shifted:** repurposed as `loop_in` (sets the loop-in point).
- **Loop ×2 (unshifted):** `loop_double`. **Shifted:** repurposed as `loop_out` (sets the loop-out point).

Keys: `deck[N].loop.input`, `.loopHalf.input`, `.loopDouble.input`.

## Deck switch

Selects which physical deck a paired hardware channel controls (deck-swap between 1↔3 and 2↔4).

| Action | Status (deck 1→4) | Midino |
|---|---|---|
| Press | `0x90-93` | `0x08` |
| Release | `0x80-83` | `0x08` |

Key: `deckSwitch`. Pressing deck `n`'s button activates deck `n+1` (1-indexed) and deactivates its paired deck (0↔2, 1↔3 by index); also zeroes the alt-deck VU meters on `0xBF, 0x44`/`0x45`.

## Shift button

**Pattern C** — one logical control mapped 8 times, all sharing `midino 0x20`, so it broadcasts identically across all four per-deck channels:

| Status | Midino |
|---|---|
| `0x90` press / `0x80` release | `0x20` |
| `0x91` press / `0x81` release | `0x20` |
| `0x92` press / `0x82` release | `0x20` |
| `0x93` press / `0x83` release | `0x20` |

Key: `shiftToggle` (group `[Master]`). When the press arrives on status `0x91` or `0x93`, the script additionally records `rightShift = true` — used only to disambiguate the browse-knob button's preview-vs-load behavior (see [`browse-fx.md`](browse-fx.md#browse-knob-push)). Shift cascades to every deck, the browse section, both FX units, and the cue-gain knob (which becomes a global Sampler pregain knob while held — see [`mixer.md`](mixer.md#headphone-cue-gain--mix)).
