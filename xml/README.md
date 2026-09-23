# XML Builder

Small [Bun](https://bun.sh) script that generates the Mixxx `.midi.xml` mapping file from TypeScript sources, instead of hand-writing a single huge XML file.

## Requirements

- [Bun](https://bun.sh)

## Install

```bash
bun install
```

## Usage

Build the XML file and write it to disk (default target):

```bash
./build.sh
```

This generates `../Numark Mixtrack Platinum FX.midi.xml`.

### Dev mode

Runs with logging enabled and does **not** write the file by default:

```bash
./build.dev.sh
```

### Environment variables

| Variable            | Default                                   | Description                                                  |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| `NODE_ENV`          | -                                         | Set to a value containing `dev` to enable dev mode           |
| `EXPORT`            | `1` outside dev mode                      | Set to `1`/`yes` to force writing the file, even in dev mode |
| `OUTPUT`            | `../Numark Mixtrack Platinum FX.midi.xml` | Output file path                                             |
| `BEAUTIFY`          | enabled in dev mode                       | Set to `1`/`yes` to pretty-print the XML output              |
| `SCRIPT_ENTRYPOINT` | `MixtrackPlatinumFX`                      | Function prefix used for the controller script               |

### Examples

Write the file with pretty-printed output:

```bash
BEAUTIFY=1 ./build.sh
```

Preview the generated XML in the terminal without writing it:

```bash
NODE_ENV=dev ./build.sh
```

Write to a custom location:

```bash
OUTPUT=./output/mapping.xml ./build.sh
```

## Project structure

- `build.ts` - entry point, assembles the XML document and writes it to disk
- `src/info.ts` - mapping metadata (`<info>` node: name, author, description...)
- `src/controller.ts` - controller node: script files, controls and outputs
- `src/controls/` - MIDI input mappings (direct controls and scripted controls)
- `src/outputs/` - MIDI output mappings
- `utils/` - shared helpers and environment constants
