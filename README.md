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
- Desktop app and plain `dsh web` — the zoom is renderer-only, no host route or Electron API required
- Colours use `--dsw-alias-*` tokens, so light/dark themes and third-party skins keep working

## How the zoom stays layout-correct

CSS `zoom` on `<html>` only scales paint. DSH measures its shell and positions its popovers in JS pixels (`window.innerHeight`, `getBoundingClientRect`, `MouseEvent.clientX`), so a plain CSS zoom pushed the composer, the model picker and the reasoning-effort panel outside the viewport above 100% — the boxes were still there, just off-screen.

Electron's own `webContents.setZoomFactor` would change the coordinate space, but the desktop host runs the dsh server as a Node-mode child (`ELECTRON_RUN_AS_NODE=1`) with no `BrowserWindow` access, and the renderer exposes no zoom IPC. So the zoom is implemented as CSS `zoom` **plus a metric shim**: while zoomed, these are divided by the zoom factor, which is exactly the coordinate semantics of browser zoom (layout in CSS px, paint scaled):

```
window.innerWidth / innerHeight
Element.clientWidth / clientHeight
Element.getBoundingClientRect()
MouseEvent.clientX / clientY
```

The shim is removed again at 100%. Verified in the desktop app at 60%–180%: the composer, model picker and reasoning-effort menus keep their normal positions.

## Development

```sh
node scripts/smoke.mjs   # runs the bundle against React/DOM stubs: register, apply, render
node --check lib/client.js
node --check lib/index.js
```

Layout:

```
lib/index.js       host half (empty plugin; makes the package a real Cordis plugin)
lib/client.js      browser bundle: zoom + metric shim + Settings entry
cordis.patch.yml   bundle patch inserting the plugin into the profile tree
scripts/smoke.mjs  browser-free smoke test
```

## License

MIT
