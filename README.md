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
dsh plugin --profile web add github:sjrslh/dsh-ui-zoom
```

Restart `dsh web` (or the desktop app) afterwards.

An npm release is planned. Once it is published, `dsh plugin --profile web add dsh-ui-zoom` will work as well.

## Compatibility

- dsh `>= 0.1.0-rc.6`
- Desktop app: native zoom through Electron's `webContents.setZoomFactor`
- Plain `dsh web`: the host route reports `supported:false`, the plugin stops swallowing `Ctrl`+wheel and the browser's own page zoom takes over
- Colours use `--dsw-alias-*` tokens, so light/dark themes and third-party skins keep working

## Why native zoom, not CSS zoom

The first version scaled the page with CSS `zoom` on `<html>`. That scales paint only: DSH measures the shell and positions its popovers in JS pixels, so anything above 100% pushed the composer, the model picker and the reasoning-effort panel outside the viewport — the boxes were still there, just off-screen.

This version asks the host to change the real page zoom instead:

```
renderer  --fetch /dsh-ui-zoom/zoom-->  host plugin  --webContents.setZoomFactor-->  Electron
```

Native zoom changes the layout viewport, so text, spacing, the composer and every secondary popover keep their normal coordinates. That was verified against the model picker and reasoning-effort menus at 60%–180%.

The host half lives in `lib/index.js`: it only answers on loopback (or same-origin), clamps the factor to 0.6–1.8, and reports `supported:false` when there is no Electron window to drive.

## Development

```sh
node scripts/smoke.mjs   # runs the bundle against React/DOM stubs: register, apply, render
node --check lib/client.js
node --check lib/index.js
```

Layout:

```
lib/index.js       host half: the /dsh-ui-zoom/zoom route and the Electron zoom bridge
lib/client.js      browser bundle (__ModuleLoader__ format, no build step)
cordis.patch.yml   bundle patch inserting the plugin into the profile tree
scripts/smoke.mjs  browser-free smoke test
```

## License

MIT
