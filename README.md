# dsh-ui-zoom

Two small additions for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`):

- **Ctrl + wheel page zoom** — text, spacing and icons scale together, like a browser
- **A Settings button in the bottom-right corner** — no shortcut required

## What it does

| Gesture | Result |
| --- | --- |
| `Ctrl` + wheel up / down | Zoom in / out, 60%–180%, 10% per step |
| `Ctrl` + `0` | Back to 100% |
| While zooming | A centred percentage pill appears for 900 ms |

- The level is stored in `localStorage` (`dsh-ui-zoom:level`) and survives reloads and restarts
- 60 ms throttle: one notch per wheel click, trackpad pinch (ctrl+wheel on Windows) does not jump
- `Ctrl`+wheel inside a terminal is left alone for xterm's own font zoom
- The Settings button calls the host's `settings.open` command first, falls back to the account menu's Settings item, then to a synthetic `Ctrl+,`

## Install

```sh
dsh plugin --profile web add dsh-ui-zoom
```

Restart `dsh web` (or the desktop app) afterwards. GitHub-only:

```sh
dsh plugin --profile web add github:OWNER/dsh-ui-zoom
```

> Replace `OWNER` with the repository owner.

## Compatibility

- dsh `>= 0.1.0-rc.6`
- Desktop and web; on desktop the `Ctrl+,` path goes through Electron's native keyboard bridge, which is why this plugin drives the host command instead of synthesising key events
- Colours use `--dsw-alias-*` tokens, so light/dark themes and third-party skins keep working

## Why the fonts and the UI scale together

The plugin only sets CSS `zoom` on `<html>`; it does not patch individual `font-size` values. DSH lays out on

```css
html, body, #root { height: 100% }
```

so percentage heights re-resolve against the zoomed viewport and the whole page scales as one coordinate system — text, cards, spacing, icons and `position: fixed` elements included.

**Known boundary:** CSS `zoom` does not change what `vh` / `dvh` resolve to. DSH uses `100dvh` for the `max-height` of a few dialogs (schedule zone menu, directory picker, shortcuts panel); at high zoom those caps get a little loose. The main layout is unaffected.

## Development

```sh
node scripts/smoke.mjs   # runs the bundle against React/DOM stubs: register, apply, render
node --check lib/client.js
```

Layout:

```
lib/index.js       host half (empty plugin; makes the package a real Cordis plugin)
lib/client.js      browser bundle (__ModuleLoader__ format, no build step)
cordis.patch.yml   bundle patch inserting the plugin into the profile tree
scripts/smoke.mjs  browser-free smoke test
```

## License

MIT
