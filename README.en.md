# dsh-ui-zoom

[中文](README.md) | [English](README.en.md)

> A little blue whale living inside DeepSeek Harness: it scales the whole UI for you.
> Not just the text — sidebars, composer, popovers and icons grow together, and the popovers stay where they belong.

A client plugin for [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness). No host changes.

## ✨ Features

- **True page zoom, 60%–180%** in 10% steps — layout, not font size.
- **Three gestures**: `Ctrl` + wheel, `Ctrl` + `=`, `Ctrl` + `-`; `Ctrl` + `0` resets to 100%.
- **Popovers stay put**: DSH measures its shell in JS (`innerWidth` / `innerHeight` / `getBoundingClientRect` / `clientX`), so the plugin divides those values by the zoom factor too — model picker, reasoning menu and account menu land where they should.
- **No page jump at the end of a list**: while zoomed the document root scroller is locked (the previous inline styles are remembered and restored at 100%).
- **A Settings button in the bottom-right corner**: calls the host's `settings.open` first, then the account menu, then a synthetic `Ctrl + ,`.
- **Level remembered** in `localStorage` (`dsh-ui-zoom:level`).
- **Terminals are left alone**: `Ctrl` + wheel over xterm is passed through.
- **Small and quiet**: no network, no file access, one localStorage key.

## 🎛️ How it differs

| Approach | Page zoom | Popovers stay in place | No page jump | Settings button |
|---|---|---|---|---|
| Font-size only | ✗ | — | — | — |
| Plain CSS `zoom` | ✓ | ✗ popovers leave the viewport | ✗ | maybe |
| Region zoom | partial | ✓ | — | depends |
| **dsh-ui-zoom** | ✓ | ✓ metric shim | ✓ root scroll lock | ✓ |

## 📦 Install

### Option 1 — one command (recommended)

```bash
dsh plugin --profile desktop add github:sjrslh/dsh-ui-zoom
```

Use `--profile web` for the web profile. Press `Ctrl + R` or restart DSH afterwards.

### Option 2 — from a release (offline / pinned version)

Download `dsh-ui-zoom-0.4.0.tgz` from [Releases](../../releases), then:

```bash
dsh plugin --profile desktop add /path/to/dsh-ui-zoom-0.4.0.tgz
```

### Option 3 — clone and link (for hacking on it)

```bash
git clone https://github.com/sjrslh/dsh-ui-zoom.git
dsh plugin --profile desktop add ./dsh-ui-zoom
```

Edit `lib/client.js`, press `Ctrl + R`, done — there is no build step.

## 🚀 Usage

| Action | Result |
|---|---|
| `Ctrl` + wheel up / down | zoom in / out, 10% per step |
| `Ctrl` + `=` (or `+`) | zoom in 10% |
| `Ctrl` + `-` | zoom out 10% |
| `Ctrl` + `0` | back to 100% |
| bottom-right **Settings** | open the DSH settings panel |

A percentage pill appears for 900 ms while zooming. The range is clamped to 60%–180%.

## 🧱 Layout

```text
dsh-ui-zoom/
├─ lib/
│  ├─ index.js            # host entry (empty, keeps the package a valid Cordis plugin)
│  └─ client.js           # zoom, metric shim, scroll lock, settings button
├─ scripts/
│  ├─ smoke.mjs           # loads the bundle, renders the overlay once
│  └─ zoom.test.mjs       # metric assertions at 150% and the full restore
├─ cordis.patch.yml
├─ package.json
├─ CHANGELOG.md
├─ README.md              # Chinese
└─ README.en.md           # this file
```

## ❓ FAQ

**Why not just bump the font size?** Buttons, icons and spacing would stay the same and the UI would get cramped; this scales the whole layout.

**Do popovers drift after zooming?** No. Native browser zoom shrinks the layout viewport; CSS `zoom` only scales paint, so the plugin divides the JS-visible metrics by the zoom factor to keep both in the same coordinate space.

**Why does the page no longer slide at the end of a list?** `zoom` enlarges the root box, so the document gains a scrollable strip; the plugin locks the root scroller while zoomed and restores the previous styles at 100%.

**Performance?** One style write per zoom step and one localStorage write. No polling, no observers.

**DSH versions?** `engines.dsh >= 0.1.0-rc.6`, `dshTarget 0.2.0-rc.2`. Older builds have no `shell.overlay` slot.

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md).

## 📄 License

[MIT](LICENSE).
