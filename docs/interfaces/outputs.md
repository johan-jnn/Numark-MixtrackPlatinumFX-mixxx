# Outputs — LEDs, VU meter, spinner & screen

Everything Mixxx sends back to the controller. The XML declares exactly **one** kind of output via its `<output>` mechanism (Keylock). Every other LED, the VU meter, the platter spinner/position bar, and the entire numeric screen are driven by raw `midi.sendShortMsg` / `midi.sendSysexMsg` calls in the JS, with no XML `<output>` declaration.

## Keylock LED

The only control declared via the XML's `<output>` mechanism. 8 entries (note on + note off status, ×4 channels), all `midino 0x0D`, `minimum 0.5` (i.e. the LED lights when the Mixxx `keylock` control is ≥ 0.5 — on):

| Group | Status | Midino |
|---|---|---|
| `[Channel1]` | `0x80`, `0x90` | `0x0D` |
| `[Channel2]` | `0x81`, `0x91` | `0x0D` |
| `[Channel3]` | `0x82`, `0x92` | `0x0D` |
| `[Channel4]` | `0x83`, `0x93` | `0x0D` |

The JS additionally re-sends this same message pair at init time (`midi.sendShortMsg(0x80|i / 0x90|i, 0x0D, keylock ? 0x7F : 0x00)`) and at shutdown (forces it to `0x00`) — the code comment notes this is because "the output mapping in the xml doesn't seem to do it" reliably on its own. There is no dedicated Keylock **button**; it's toggled via Shift + Pitch-bend-up (see [`decks-transport.md`](decks-transport.md#pitch-bend-buttons)).

## FX select LEDs

| Element | Status | Midino | Value |
|---|---|---|---|
| Unit1 Effect1/2/3 | `0x98` | `0x00` / `0x01` / `0x02` | `0x7F` on, `0x01` off |
| Unit2 Effect1/2/3 | `0x99` | `0x03` / `0x04` / `0x05` | `0x7F` on, `0x01` off |

Sent both on toggle (in response to a button press) and periodically while "holding the enable switch" blinks the currently-enabled effect LEDs (toggles between real state and `0x01` at the shared 350 ms blink tick, only while a unit's enable switch is physically held down).

## Deck-active LEDs

| Status | Midino | Value | When |
|---|---|---|---|
| `0x90` | `0x08` | `0x7F` | Deck 1 active (default at init/shutdown) |
| `0x91` | `0x08` | `0x7F` | Deck 2 active (default at init/shutdown) |

Updated live from [Deck switch](decks-transport.md#deck-switch) (the newly-active deck's status/midino gets `0x7F`; there's no explicit "off" message sent for the deactivated one in this excerpt — it relies on the LED being mode-select-button-scoped hardware behavior).

## BPM up/down arrows

| Element | Status | Midino | Value |
|---|---|---|---|
| Down arrow | `0x80 \| deck` | `0x0A` | `1` = lit, `0` = off |
| Up arrow | `0x80 \| deck` | `0x09` | `1` = lit, `0` = off |

Compares each deck's BPM against its "paired alt deck" BPM (deck 1 pairs with whichever of 1/3 is inactive as the alt reference for the other, etc. — driven by which deck is `active`), with a 0.05 BPM tolerance, so the arrows only light when there's a meaningful tempo mismatch. `updateArrows(true)` forces a full refresh (called on deck switch and BPM change); `updateArrows(false, true, deck)` is a special "force show both arrows" mode used while tap-tapping a deck's tempo, to visually indicate which deck is the tap target.

## Time-elapsed/remaining toggle

Broadcast to all 4 decks together whenever Mixxx's `ShowDurationRemaining` setting changes:

| Status | Midino | Value |
|---|---|---|
| `0x90`, `0x91`, `0x92`, `0x93` | `0x46` | `0x00` = show elapsed, `0x7F` = show remaining |

(A third state, "both", is ignored — the controller's screen can't show both at once.)

## Rate-range display

| Status | Midino | Value |
|---|---|---|
| `0x90 + channel` | `0x0E` | `range * 100` (e.g. range `0.08` → `8`) |

Sent whenever the pitch range is changed via Shift + Pitch-bend-down (see [`decks-transport.md`](decks-transport.md#pitch-bend-buttons)).

## Position bar & platter spinner

Both driven from the deck's `playposition` output, on the deck's CC channel:

| Element | Status | Midino | Value |
|---|---|---|---|
| Position bar | `0xB0 \| channel` | `0x3F` | `round(playposition * 52)`, clamped to ≥ 0 (controller expects range 0-52) |
| Platter spinner | `0xB0 \| channel` | `0x06` | Rotation animation, range 64-115 (52 steps): computed from `(elapsedTime mod 1.8s) * (52 / 1.8s)`, offset by `+64` (or `+115` in the negative-value branch — this looks like a min-clamp edge case in the original code rather than intentional, kept here for accuracy) |

The 1.8 s period corresponds to one full platter rotation at the assumed 33⅓ RPM.

## VU meter

| Element | Status | Midino | Value |
|---|---|---|---|
| VU meter level | `0xB0 + deckOffset` | `0x1F` | `engine VuMeter value * 90` (controller expects range 0-90) |

Driven by `engine.makeConnection("[ChannelN]", "VuMeter", ...)`, one connection per channel.

Deck-switch additionally zeroes the *other pair's* VU meters directly: `midi.sendShortMsg(0xBF, 0x44, 0)` and `midi.sendShortMsg(0xBF, 0x45, 0)`.

## Pad-mode & pad LED init

At `PadSection` construction (once per deck, at startup), before any mode is selected:

| Mode button | Status | Midino | Initial value |
|---|---|---|---|
| Hotcue | `0x93 + deckNumber` | `0x00` | on (`0x7F`) — default active mode |
| Autoloop | `0x93 + deckNumber` | `0x0D` | off (`0x01`) |
| Fader Cuts | `0x93 + deckNumber` | `0x07` | off (`0x01`) |
| Sample 1 | `0x93 + deckNumber` | `0x0B` | off (`0x01`) |
| Sample 2 (shifted) | `0x93 + deckNumber` | `0x0F` | off (`0x01`) |
| Beatjump (shifted) | `0x93 + deckNumber` | `0x02` | off (`0x01`) |

See [`pads.md`](pads.md#led-behavior) for the general mode-switch LED logic, the `0x09` Fader-Cuts brightness quirk, blink timing, and `disablePadLights()`.

## Fader-cuts pad-count SysEx

Controls how many of the 8 pads the controller's **own firmware** lights up in Fader-Cuts mode (this pad mode is hardware-driven, not per-pad-mapped by Mixxx):

| Purpose | Bytes |
|---|---|
| `faderCutSysex4` — light only the top 4 pads (**sent by default at init**) | `F0 00 20 7F 13 F7` |
| `faderCutSysex8` — light all 8 pads | `F0 00 20 7F 03 F7` |

## Init / shutdown handshake SysEx

| Purpose | Bytes | When |
|---|---|---|
| Exit demo / lightshow | `F0 7E 00 06 01 F7` | Start of `init()` |
| Status/handshake | `F0 00 20 7F 03 01 F7` | After component setup in `init()` |
| Shutdown | `F0 00 20 7F 02 F7` | End of `shutdown()` |

A handful of additional SysEx byte sequences appear only as **commented-out reverse-engineering notes** near `init()` (a possible extended status/handshake variant, a "wake" message, and several "dial update" frames). They are not sent by the script and are not documented here as active protocol — treat them as researcher notes only if you need to dig further into the firmware protocol.

## Screen protocol (BPM / rate / time / duration)

Each screen field is sent as its own SysEx frame:

```
F0 00 20 7F <deck> <field> <value nibbles...> F7
```

`<deck>` = 1-4 (not 0-indexed). `<field>` selects which display:

| Field byte | Display | Nibble count sent | Helper function |
|---|---|---|---|
| `0x01` | BPM (×100, rounded) | 6 | `sendScreenBpmMidi` |
| `0x02` | Pitch/rate (×10000, rounded) | 6 | `sendScreenRateMidi` |
| `0x03` | Track duration, ms (`duration - 1`, min `1`) | 8 | `sendScreenDurationMidi` |
| `0x04` | Elapsed/remaining time, ms | 8 | `sendScreenTimeMidi` |

### Nibble encoding (`encodeNumToArray`)

A 32-bit signed integer is split into 8 nibbles, most-significant first:

```
[ (n>>28)&0xF, (n>>24)&0xF, (n>>20)&0xF, (n>>16)&0xF,
  (n>>12)&0xF, (n>>8)&0xF,  (n>>4)&0xF,  n&0xF ]
```

If a `drop` count is given, that many nibbles are removed from the **front** of the array first (used by BPM/rate to shorten the frame). After that, the array's new first element is overwritten with a **sign marker**: `0x07` if the number is negative, `0x08` otherwise (the function has an `unsigned` flag to skip this, but no call site in this mapping ever sets it).

Two things worth knowing if you're reimplementing this:
- **Duration & time** (`0x03`/`0x04`) pass no `drop`, so all 8 nibbles are sent, with nibble 0 being the sign marker.
- **Rate** (`0x02`) passes `drop=2`, so nibbles 0-1 are dropped *inside* the function, then the sign marker overwrites the new nibble 0 (original nibble 2) — 6 nibbles are sent, with a real sign marker.
- **BPM** (`0x01`) passes no `drop` to `encodeNumToArray` (sign marker written to original nibble 0), but the **caller** (`sendScreenBpmMidi`) then does `bpmArray.shift(); bpmArray.shift();` on the returned array — discarding both the sign-marker nibble and the next data nibble. 6 nibbles are sent, but **without** a sign marker (BPM is always positive in practice, so this goes unnoticed).
