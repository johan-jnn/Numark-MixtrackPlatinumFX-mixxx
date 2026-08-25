# Jog wheels

Two messages per deck: touch (note) and rotation (relative CC).

| Element | Group | Status (deck 1→4) | Midino | Mixxx key |
|---|---|---|---|---|
| Touch | `[ChannelN]` | `0x90-93` | `0x06` | `wheelTouch` |
| Turn (rotate) | `[ChannelN]` | `0xB0-B3` | `0x06` | `wheelTurn` |

Both are `<script-binding/>` — the raw `channel, control, value, status, group` are handled directly in JS rather than through a components object.

## Touch

- `value == 0x7F` → touch start.
- `value == 0x00` → touch end.

If **not** shifted and the deck's scratch mode is enabled (see [Scratch toggle](decks-transport.md#scratch-toggle)):
- Touch start → `engine.scratchEnable(deck, 1024, 33+1/3, 1, 1/32, true)`
- Touch end → `engine.scratchDisable(deck, true)`

Parameters: sensitivity `1024`, RPM `33⅓`, alpha `1`, beta `1/32` (jog-wheel smoothing filter), `true` = ramp on release. If Shift is held or scratch mode is off, touch has no effect (turning the wheel still nudges pitch — see below).

## Turn (rotation)

7-bit relative encoder value, decoded as signed with the standard MIDI two's-complement-style convention:

```
newValue = value
if (value >= 64) newValue -= 128   // effective range: -63..+63... +63
```

Then, depending on state:

| State | Behavior |
|---|---|
| Shift held | **Seek**: `playposition += newValue / 10000` |
| Not shifted, scratch mode on, and currently scratching (touched) | **Scratch**: `engine.scratchTick(deck, newValue)` |
| Otherwise | **Pitch nudge**: `engine.setValue(group, "jog", newValue / 10)` |

("Currently scratching" requires both the touch handler having called `scratchEnable` *and* `engine.isScratching(deck)` being true — i.e. rotation alone, without touch, never scratches; it always falls through to the pitch-nudge branch.)
