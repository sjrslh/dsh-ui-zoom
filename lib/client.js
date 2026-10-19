window.__ModuleLoader__.load({
	id: "dsh-ui-zoom",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const react = require("react");
		const h = react.createElement;
		const { useState, useEffect } = react;

		const name = "dsh-ui-zoom";
		const inject = ["slots", "locale"];
		const NS = "dsh-ui-zoom";
		const STYLE_ID = "dsh-ui-zoom/styles";

		const zh = {
			settings: "设置",
			settingsHint: "打开设置（Ctrl+,）",
			zoomReset: "缩放已重置为 100%",
		};
		const en = {
			settings: "Settings",
			settingsHint: "Open settings (Ctrl+,)",
			zoomReset: "Zoom reset to 100%",
		};

		/** Bound by apply(); components read it through useT(). */
		let translate = (key) => key;
		function useT() {
			return translate;
		}

		//#region zoom state
		/*
		 * Ctrl+wheel page zoom, renderer-only.
		 *
		 * DSH measures its shell and positions its popovers in JS pixels
		 * (window.innerHeight, getBoundingClientRect, MouseEvent.clientX). A plain
		 * CSS `zoom` on <html> only scales paint, so those values stay in screen
		 * pixels and the zoomed layout is pushed outside the viewport — the
		 * composer and the model/reasoning popovers ended up off-screen above 100%.
		 *
		 * Electron's own page zoom would fix the coordinate space, but the desktop
		 * host runs the dsh server as a Node-mode child (ELECTRON_RUN_AS_NODE=1)
		 * with no BrowserWindow access, and the renderer exposes no zoom IPC.
		 *
		 * So the zoom is CSS `zoom` plus a metric shim: while zoomed, these values
		 * are divided by the zoom factor, which is the coordinate semantics of
		 * browser zoom (layout in CSS px, paint scaled by zoom):
		 *   window.innerWidth / innerHeight
		 *   Element.clientWidth / clientHeight
		 *   Element.getBoundingClientRect()
		 *   MouseEvent.clientX / clientY
		 * The shim is removed again at 100%.
		 */
		const ZOOM_KEY = "dsh-ui-zoom:level";
		const ZOOM_MIN = 0.6;
		const ZOOM_MAX = 1.8;
		const ZOOM_STEP = 0.1;
		const ZOOM_THROTTLE_MS = 60;

		let zoomValue = 1;
		let zoomLastStepAt = 0;
		let zoomShim = null;
		const zoomSubs = new Set();

		function clampZoom(value) {
			const num = Math.round(Number(value) * 100) / 100;
			if (!Number.isFinite(num)) return 1;
			return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, num));
		}

		function zoomNotify() {
			for (const listener of zoomSubs) {
				try { listener(zoomValue); } catch { /* ignore */ }
			}
		}

		function scaleRect(rect, factor) {
			const x = rect.x / factor;
			const y = rect.y / factor;
			const width = rect.width / factor;
			const height = rect.height / factor;
			if (typeof DOMRect === "function") {
				try { return new DOMRect(x, y, width, height); } catch { /* fall through */ }
			}
			const out = { x, y, left: x, top: y, right: x + width, bottom: y + height, width, height };
			out.toJSON = () => out;
			return out;
		}

		function restoreMetrics(restore) {
			for (let i = restore.length - 1; i >= 0; i -= 1) {
				try { restore[i](); } catch { /* ignore */ }
			}
		}

		function installZoomShim(factor) {
			if (zoomShim) {
				if (zoomShim.factor === factor) return;
				restoreMetrics(zoomShim.restore);
				zoomShim = null;
			}
			if (factor === 1 || typeof window === "undefined") return;
			const restore = [];
			const patchGetter = (obj, prop) => {
				let target = obj;
				let desc = null;
				while (target && !desc) {
					desc = Object.getOwnPropertyDescriptor(target, prop);
					if (!desc) target = Object.getPrototypeOf(target);
				}
				if (!desc || !desc.get) return;
				Object.defineProperty(obj, prop, {
					configurable: true,
					enumerable: desc.enumerable,
					get() { return desc.get.call(this) / factor; },
				});
				restore.push(() => Object.defineProperty(obj, prop, desc));
			};
			patchGetter(window, "innerWidth");
			patchGetter(window, "innerHeight");
			if (typeof Element !== "undefined") {
				patchGetter(Element.prototype, "clientWidth");
				patchGetter(Element.prototype, "clientHeight");
				const rectFn = Element.prototype.getBoundingClientRect;
				Element.prototype.getBoundingClientRect = function () {
					return scaleRect(rectFn.call(this), factor);
				};
				restore.push(() => { Element.prototype.getBoundingClientRect = rectFn; });
			}
			if (typeof MouseEvent !== "undefined") {
				patchGetter(MouseEvent.prototype, "clientX");
				patchGetter(MouseEvent.prototype, "clientY");
			}
			zoomShim = { factor, restore };
		}

		let rootScrollPrev = null;
		function setRootScrollLocked(locked) {
			const html = document.documentElement;
			const body = document.body;
			if (locked) {
				if (rootScrollPrev === null) {
					rootScrollPrev = {
						htmlOverflow: html.style.overflow,
						htmlOverscroll: html.style.overscrollBehavior,
						bodyOverscroll: body ? body.style.overscrollBehavior : "",
					};
				}
				/*
				 * CSS zoom enlarges the root box, so the document gains a
				 * scrollable strip equal to (zoom - 1) x viewport. When an
				 * inner list reaches its end the wheel chains to that document
				 * scroller and the whole UI slides up. Lock the root scroller:
				 * the app's own scrollers keep working, the page no longer moves.
				 */
				html.style.overflow = "hidden";
				html.style.overscrollBehavior = "none";
				if (body) body.style.overscrollBehavior = "none";
			} else if (rootScrollPrev !== null) {
				if (rootScrollPrev.htmlOverflow) html.style.overflow = rootScrollPrev.htmlOverflow;
				else html.style.removeProperty("overflow");
				if (rootScrollPrev.htmlOverscroll) html.style.overscrollBehavior = rootScrollPrev.htmlOverscroll;
				else html.style.removeProperty("overscroll-behavior");
				if (body) {
					if (rootScrollPrev.bodyOverscroll) body.style.overscrollBehavior = rootScrollPrev.bodyOverscroll;
					else body.style.removeProperty("overscroll-behavior");
				}
				rootScrollPrev = null;
			}
		}
		function paintZoom(value) {
			try {
				if (value === 1) {
					document.documentElement.style.removeProperty("zoom");
					setRootScrollLocked(false);
				} else {
					document.documentElement.style.zoom = String(value);
					setRootScrollLocked(true);
				}
			} catch { /* no document in a test harness */ }
			installZoomShim(value);
		}

		function applyZoom(value, persist = true) {
			zoomValue = clampZoom(value);
			paintZoom(zoomValue);
			if (persist) {
				try { window.localStorage.setItem(ZOOM_KEY, String(zoomValue)); } catch { /* ignore */ }
			}
			zoomNotify();
			return zoomValue;
		}

		function restoreZoom() {
			let stored = 1;
			try {
				const raw = window.localStorage.getItem(ZOOM_KEY);
				if (raw !== null) stored = clampZoom(raw);
			} catch { /* ignore */ }
			zoomValue = stored;
			paintZoom(stored);
			return stored;
		}
		//#endregion

		//#region settings entry
		/*
		 * The host's own Settings button is the fallback of the
		 * `settings.launcher` slot; the account menu occupies that slot, so the
		 * button is not in the DOM at all. The reliable entry is the host's
		 * `settings.open` command, living on ShortcutRegistry (not on the
		 * service object). Two DOM-level fallbacks follow it.
		 */
		let shortcuts = null;

		function settingsPanelOpen() {
			try {
				return !!document.querySelector('[data-shortcut-modal="settings"], [role="dialog"][aria-modal="true"], [data-maid-settings-overlay] [role="dialog"]')
					|| document.body.hasAttribute("data-maid-settings-open");
			} catch { return false; }
		}

		function invokeSettingsCommand() {
			const registry = shortcuts && shortcuts.registry;
			if (!registry || typeof registry.invoke !== "function") return false;
			registry.invoke("settings.open", {
				target: document.activeElement,
				region: "page",
				modal: null,
			});
			return true;
		}

		function openViaAccountMenu() {
			const scope = document.querySelector('[data-slot="sidebar.settings"]');
			if (!scope) return false;
			const buttons = Array.from(scope.querySelectorAll("button"));
			const launcher = buttons.find((node) => node.getAttribute("aria-haspopup") === "menu")
				|| buttons.find((node) => (node.getAttribute("aria-label") || "").length > 0);
			if (!launcher) return false;
			launcher.click();
			window.setTimeout(() => {
				try {
					const items = Array.from(document.querySelectorAll('[role="menuitem"], [role="menu"] button, [role="menu"] [role="option"]'));
					const hit = items.find((node) => /^(设置|設定|settings|preferences)/i.test((node.textContent || "").replace(/\s+/g, "")));
					if (hit) hit.click();
				} catch { /* ignore */ }
			}, 120);
			return true;
		}

		function syntheticSettingsKey() {
			try {
				window.dispatchEvent(new KeyboardEvent("keydown", {
					key: ",",
					code: "Comma",
					ctrlKey: true,
					bubbles: true,
					cancelable: true,
				}));
			} catch { /* ignore */ }
		}

		function openSettings() {
			if (settingsPanelOpen()) return;
			try { if (invokeSettingsCommand()) return; } catch { /* ignore */ }
			window.setTimeout(() => {
				if (settingsPanelOpen()) return;
				try {
					if (openViaAccountMenu()) {
						window.setTimeout(() => {
							if (!settingsPanelOpen()) syntheticSettingsKey();
						}, 320);
						return;
					}
				} catch { /* ignore */ }
				syntheticSettingsKey();
			}, 250);
		}
		//#endregion

		//#region styles
		const CSS = [
			".dsh-ui-zoom-settings{position:fixed;right:16px;bottom:16px;z-index:900;appearance:none;display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 13px 0 11px;border:1px solid color-mix(in srgb,var(--dsw-alias-border-l1,#4a4a4a) 70%,transparent);border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#1c1c1c) 82%,transparent);backdrop-filter:blur(12px) saturate(1.2);-webkit-backdrop-filter:blur(12px) saturate(1.2);color:var(--dsw-alias-label-secondary,#cfcfcf);cursor:pointer;font:13px/1 inherit;letter-spacing:.02em;box-shadow:0 6px 18px color-mix(in srgb,#000 22%,transparent);pointer-events:auto;transition:color .15s,border-color .15s,background .15s}",
			".dsh-ui-zoom-settings:hover{color:var(--dsw-alias-label-primary,#fff);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#6dbf8c) 60%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#6dbf8c) 14%,transparent)}",
			".dsh-ui-zoom-settings:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#6dbf8c);outline-offset:2px}",
			".dsh-ui-zoom-settings svg{flex:none;opacity:.9}",
			".dsh-ui-zoom-hud{position:fixed;left:50%;bottom:76px;transform:translateX(-50%);z-index:10060;pointer-events:none;padding:6px 12px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#1c1c1c) 78%,transparent);border:1px solid color-mix(in srgb,var(--dsw-alias-border-l1,#555) 60%,transparent);color:var(--dsw-alias-label-primary,#f2f2f2);font:12px/1.2 inherit;letter-spacing:.04em;box-shadow:0 10px 26px color-mix(in srgb,#000 30%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}",
		].join("");

		function installStyles() {
			try {
				if (document.getElementById(STYLE_ID)) return;
				const tag = document.createElement("style");
				tag.id = STYLE_ID;
				tag.dataset.plugin = "dsh-ui-zoom";
				tag.textContent = CSS;
				document.head.appendChild(tag);
			} catch { /* ignore */ }
		}

		function removeStyles() {
			try {
				const tag = document.getElementById(STYLE_ID);
				if (tag) tag.remove();
			} catch { /* ignore */ }
		}
		//#endregion

		//#region components
		function ZoomHud() {
			const [pct, setPct] = useState(Math.round(zoomValue * 100));
			const [shownAt, setShownAt] = useState(0);
			useEffect(() => {
				const onChange = (value) => {
					setPct(Math.round(value * 100));
					setShownAt(Date.now());
				};
				zoomSubs.add(onChange);
				const inTerminal = (event) => {
					try {
						const path = typeof event.composedPath === "function" ? event.composedPath() : [];
						return path.some((node) => node instanceof Element
							&& (node.classList.contains("xterm") || node.hasAttribute("data-terminal")));
					} catch { return false; }
				};
				const onWheel = (event) => {
					if (!event.ctrlKey || event.altKey || event.metaKey) return;
					if (!event.deltaY) return;
					if (inTerminal(event)) return;
					event.preventDefault();
					event.stopPropagation();
					const now = Date.now();
					if (now - zoomLastStepAt < ZOOM_THROTTLE_MS) return;
					zoomLastStepAt = now;
					applyZoom(zoomValue + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
				};
				const onKey = (event) => {
					if (!event.ctrlKey || event.altKey || event.metaKey) return;
					if (event.key === "0" || event.code === "Digit0") {
						event.preventDefault();
						applyZoom(1);
					}
				};
				window.addEventListener("wheel", onWheel, { passive: false, capture: true });
				window.addEventListener("keydown", onKey, true);
				return () => {
					zoomSubs.delete(onChange);
					window.removeEventListener("wheel", onWheel, true);
					window.removeEventListener("keydown", onKey, true);
				};
			}, []);
			useEffect(() => {
				if (!shownAt) return;
				const timer = window.setTimeout(() => setShownAt(0), 900);
				return () => window.clearTimeout(timer);
			}, [shownAt]);
			if (!shownAt) return null;
			return h("div", { className: "dsh-ui-zoom-hud", "aria-live": "polite" }, pct + "%");
		}

		function SettingsFab() {
			const t = useT();
			return h("button", {
				type: "button",
				className: "dsh-ui-zoom-settings",
				title: t("settingsHint"),
				"aria-label": t("settings"),
				"data-testid": "dsh-ui-zoom-settings",
				onClick: () => { openSettings(); },
			},
				h("svg", { width: 14, height: 14, viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" },
					h("path", { d: "M2.5 4.5h11M2.5 11.5h11", stroke: "currentColor", "stroke-width": "1.4", "stroke-linecap": "round" }),
					h("circle", { cx: 6, cy: 4.5, r: 1.7, fill: "currentColor" }),
					h("circle", { cx: 10.5, cy: 11.5, r: 1.7, fill: "currentColor" }),
				),
				h("span", null, t("settings")),
			);
		}

		function Overlay() {
			return h(react.Fragment, null, h(ZoomHud), h(SettingsFab));
		}
		//#endregion

		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-ui-zoom: dictionaries");
			translate = ctx.locale.bind(NS);
			ctx.effect(() => {
				installStyles();
				return removeStyles;
			}, "dsh-ui-zoom: styles");
			ctx.effect(() => {
				return () => {
					/* Disabling the plugin must not leave the page zoomed with no UI left to undo it. */
					try { applyZoom(1, false); } catch { /* ignore */ }
				};
			}, "dsh-ui-zoom: zoom cleanup");
			restoreZoom();
			if (zoomValue !== 1) {
				try { console.info("[dsh-ui-zoom] restored UI zoom", Math.round(zoomValue * 100) + "%"); } catch { /* ignore */ }
			}
			try {
				if (typeof ctx.inject === "function") {
					ctx.inject(["shortcuts"], (scoped) => { shortcuts = scoped.shortcuts; });
				} else if (ctx.shortcuts) {
					shortcuts = ctx.shortcuts;
				}
			} catch { /* ignore */ }
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "dsh-ui-zoom",
				order: 40,
			}, Overlay));
		}

		exports.name = name;
		exports.inject = inject;
		exports.apply = apply;
		return module.exports;
	}
});
