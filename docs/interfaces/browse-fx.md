# Library browse & FX units

## Browse knob (rotate)

Relative encoder, same signed-value convention as the jog wheel turn (`value >= 64 → value-128`).

| Action | Group | Status | Midino |
|---|---|---|---|
| Rotate | `[Library]` | `0xBF` | `0x00` |
| Rotate (shift) | `[Library]` | `0xBF` | `0x01` |

Key: `browse.knob.input`.
- **Unshifted:** scrolls the library list (`MoveVertical`); speed ramps up the faster/longer you keep turning (fine control for the first 3 consecutive ticks within a 100 ms window, then accelerates).
- **Shift, normal mode:** same scroll but squared acceleration (much faster).
- **Shift + "zoom" mode enabled** (`shifBrowseIsZoom` flag in the script, off by default): controls waveform zoom instead of scrolling.

## Browse knob push

| Action | Group | Status | Midino |
|---|---|---|---|
| Press | `[Library]` | `0x9F` | `0x07` |
| Release | `[Library]` | `0x8F` | `0x07` |
| Shift-press | `[Library]` | `0x9F` | `0x06` |
| Shift-release | `[Library]` | `0x8F` | `0x06` |

Key: `browse.knobButton.input`.
- **Unshifted:** `MoveFocusForward` (enter folder / focus track list).
- **Shifted:** `GoToItem` (load the highlighted track into the deck), **unless** the Shift that's held is specifically the *right-side* Shift button (tracked via `rightShift`, set when a Shift press arrives on status `0x91`/`0x93` — see [`decks-transport.md`](decks-transport.md#shift-button)), in which case it toggles **Preview Deck** playback of the highlighted track instead.

## Load buttons

Already covered per-deck in [`decks-transport.md`](decks-transport.md#load-button); listed again here since they share the `0x9F`/`0x8F` status range with the browse-knob button:

| Deck | Press | Release |
|---|---|---|
| 1 | `0x9F / 0x02` | `0x8F / 0x02` |
| 2 | `0x9F / 0x03` | `0x8F / 0x03` |
| 3 | `0x9F / 0x04` | `0x8F / 0x04` |
| 4 | `0x9F / 0x05` | `0x8F / 0x05` |

## FX units

There are two FX units, each mapped to `[EffectRack1_EffectUnit1]` / `[EffectRack1_EffectUnit2]`. Per the code, both are actually driven by the same left/right deck pairing logic used for FX-unit assignment (`fxDeck`), and the assignment follows whichever deck is currently "active" on that physical side.

| Control | Group | Status | Midino | Notes |
|---|---|---|---|---|
| Dry/Wet knob | `EffectUnit1` | `0xB8` | `0x04` | → `mix` |
| Dry/Wet knob | `EffectUnit2` | `0xB8` | `0x04` | **Identical wire address to Unit 1** — see note below |
| Effect param knob (all 3 slots share the encoder) | `EffectUnit1` | `0xB8` | `0x05` | → `parameter1` (unshifted) / `meta` (shifted) |
| Effect param knob | `EffectUnit2` | `0xB8` | `0x05` | **Identical wire address to Unit 1** |
| Effect 1 select/on-off | `EffectUnit1` | press `0x98/0x00`, release `0x88/0x00` | | |
| Effect 2 select/on-off | `EffectUnit1` | press `0x98/0x01`, release `0x88/0x01` | | |
| Effect 3 select/on-off | `EffectUnit1` | press `0x98/0x02`, release `0x88/0x02` | | |
| Effect 1 select/on-off | `EffectUnit2` | press `0x99/0x03`, release `0x89/0x03` | | |
| Effect 2 select/on-off | `EffectUnit2` | press `0x99/0x04`, release `0x89/0x04` | | |
| Effect 3 select/on-off | `EffectUnit2` | press `0x99/0x05`, release `0x89/0x05` | | |
| FX unit enable switch (3-way) | `EffectUnit1` | `0xB8` | `0x03` | 3-way toggle: `0`=middle, `1`=up, `2`=down |
| FX unit enable switch (3-way) | `EffectUnit2` | `0xB9` | `0x03` | |

> **Note — Dry/Wet and param knobs share one wire address across both FX units.** This was verified directly in the XML: `effect[0].dryWetKnob.input` and `effect[1].dryWetKnob.input` (likewise for all three `effectParam*` entries) are **both** bound to the exact same `status 0xB8` / `midino 0x04` (or `0x05`) pair, unlike the effect-select buttons and enable switch, which do use distinct channels (`0x98/0x88` vs `0x99/0x89`, `0xB8` vs `0xB9`) per unit. In practice this means turning the physical dry/wet (or param) knob sends one message that both `EffectUnit1` and `EffectUnit2` script-bindings receive and act on together.

### Effect select/enable button behavior

- Pressing (`value == 0x7F`) toggles that slot's effect on/off; unless Shift is held, pressing **any** effect button first turns **all** effects (both units) off before toggling the pressed one (mutually-exclusive-ish behavior, `allEffectOff()`).
- LED feedback is sent on the same status/midino the press arrived on: `HIGH_LIGHT (0x7F)` when enabled, `LOW_LIGHT (0x01)` when disabled. See [`outputs.md`](outputs.md#fx-select-leds) for full LED details including the "holding the enable switch" blink behavior.
- The enable switch's `value` (0/1/2) also optionally drives Mixxx's `super1` FX macro knob if `toggleFXControlSuper` is enabled (off by default in this script).

### Effect param encoder scaling

`effectParam`/`effectParam2`/`effectParam3` are relative encoders using the same signed 7-bit convention: `value < 0x40` → `+0.05` per tick, otherwise `-0.05` per tick, applied to the currently-selected effect parameter (`parameter1` unshifted, `meta` when Shift is held).
