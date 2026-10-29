import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

/*
 * Zoom-state test: loads the real bundle against a DOM stub and checks the
 * coordinate shim and the root-scroll lock, including the release at 100%.
 */

const source = readFileSync(new URL("../lib/client.js", import.meta.url), "utf8");

function makeStyle() {
	const bag = new Map();
	return {
		bag,
		setProperty(k, v) { bag.set(k, v); },
		getPropertyValue(k) { return bag.get(k) || ""; },
		removeProperty(k) { bag.delete(k); },
		get zoom() { return bag.get("zoom") || ""; },
		set zoom(v) { bag.set("zoom", String(v)); },
		get overflow() { return bag.get("overflow") || ""; },
		set overflow(v) { bag.set("overflow", String(v)); },
		get overscrollBehavior() { return bag.get("overscroll-behavior") || ""; },
		set overscrollBehavior(v) { bag.set("overscroll-behavior", String(v)); },
	};
}

const htmlStyle = makeStyle();
const bodyStyle = makeStyle();

let fitWritten = "";
const styleNode = { id: "", dataset: {}, get textContent() { return fitWritten; }, set textContent(v) { fitWritten = v; }, remove() {} };

globalThis.window = {
	__ModuleLoader__: { load: (definition) => { captured = definition; } },
	addEventListener() {},
	removeEventListener() {},
	setTimeout,
	clearTimeout,
	dispatchEvent() {},
	localStorage: {
		store: new Map([["dsh-ui-zoom:level", "1.5"]]),
		getItem(k) { return this.store.has(k) ? this.store.get(k) : null; },
		setItem(k, v) { this.store.set(k, String(v)); },
	},
};
let captured = null;

Object.defineProperty(globalThis.window, "innerWidth", { configurable: true, get: () => 1200 });
Object.defineProperty(globalThis.window, "innerHeight", { configurable: true, get: () => 900 });

class ElementStub {
	get clientWidth() { return 600; }
	get clientHeight() { return 300; }
	getBoundingClientRect() {
		return new DOMRectStub(10, 20, 600, 300);
	}
}
class DOMRectStub {
	constructor(x, y, width, height) {
		this.x = x; this.y = y; this.width = width; this.height = height;
		this.left = x; this.top = y; this.right = x + width; this.bottom = y + height;
	}
}
class MouseEventStub {
	get clientX() { return 300; }
	get clientY() { return 150; }
}

globalThis.Element = ElementStub;
globalThis.DOMRect = DOMRectStub;
globalThis.MouseEvent = MouseEventStub;
globalThis.KeyboardEvent = class KeyboardEvent {};

globalThis.document = {
	documentElement: { style: htmlStyle },
	head: { appendChild() {} },
	body: { style: bodyStyle, hasAttribute: () => false },
	activeElement: null,
	getElementById: () => null,
	querySelector: () => null,
	querySelectorAll: () => [],
	createElement: () => styleNode,
};

const React = {
	Fragment: Symbol("Fragment"),
	createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
	useState: (init) => [typeof init === "function" ? init() : init, () => {}],
	useEffect: () => {},
};

new Function(source)();
assert.ok(captured, "bundle did not register");

const mod = captured.factory((id) => {
	if (id === "react") return React;
	throw new Error(`unexpected require(${JSON.stringify(id)})`);
});

const cleanups = [];
const ctx = {
	effect: (fn) => {
		const dispose = fn();
		cleanups.push(dispose);
		return () => { if (typeof dispose === "function") dispose(); };
	},
	locale: { register: () => () => {}, bind: () => (key) => key },
	slots: {
		inject: (_name, callback) => callback(),
		register: () => () => {},
	},
	inject: (_deps, callback) => callback({ shortcuts: null }),
};

bodyStyle.setProperty("overscroll-behavior", "contain");
mod.apply(ctx);

/* --- after apply with stored 1.5 ---------------------------------------- */
assert.equal(htmlStyle.zoom, "1.5", "zoom should be restored from localStorage");
assert.equal(htmlStyle.overflow, "", "0.4.5 no longer clips the root scroller");
assert.ok(fitWritten.includes("100vh / 1.5"), "root height is reclaimed as 100vh / s");
assert.equal(htmlStyle.overscrollBehavior, "none");
assert.equal(bodyStyle.overscrollBehavior, "none");

assert.equal(window.innerWidth, 800, "innerWidth is divided by the zoom factor (1200 / 1.5)");
assert.equal(window.innerHeight, 600, "innerHeight is divided by the zoom factor (900 / 1.5)");

const el = new ElementStub();
assert.equal(el.clientWidth, 400, "clientWidth is divided by the zoom factor");
assert.equal(el.clientHeight, 200);

const rect = el.getBoundingClientRect();
assert.ok(rect instanceof DOMRectStub, "scaled rect should keep the DOMRect type");
assert.equal(rect.width, 400, "rect width is divided by the zoom factor");
assert.equal(rect.right, rect.x + rect.width, "rect edges stay consistent with x + width");

const mouse = new MouseEventStub();
assert.equal(mouse.clientX, 200, "clientX is divided by the zoom factor");
assert.equal(mouse.clientY, 100);

/* --- disabling the plugin must restore everything ------------------------ */
cleanups[cleanups.length - 1]();

assert.equal(htmlStyle.zoom, "", "zoom is removed at 100%");
assert.ok(fitWritten === "", "viewport fit style is cleared at 100%");
assert.equal(htmlStyle.overscrollBehavior, "", "root overscroll is released");
assert.equal(bodyStyle.overscrollBehavior, "contain", "the app's own body style is restored");
assert.equal(window.innerWidth, 1200, "shim removed: innerWidth is real again");
assert.equal(el.clientWidth, 600, "shim removed: clientWidth is real again");

console.log("zoom test: ok");
