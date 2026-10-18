import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const source = readFileSync(new URL("../lib/client.js", import.meta.url), "utf8");

/* ---- minimal browser surface ------------------------------------------ */
const styleNode = { id: "", dataset: {}, textContent: "", remove() {} };
globalThis.window = {
	__ModuleLoader__: { load: (definition) => { captured = definition; } },
	addEventListener() {},
	removeEventListener() {},
	setTimeout,
	clearTimeout,
	dispatchEvent() {},
	localStorage: { getItem: () => null, setItem() {} },
};
let captured = null;
globalThis.document = {
	documentElement: { style: { removeProperty() {}, set zoom(value) {} } },
	head: { appendChild() {} },
	body: { hasAttribute: () => false },
	activeElement: null,
	getElementById: () => null,
	querySelector: () => null,
	querySelectorAll: () => [],
	createElement: () => styleNode,
};
globalThis.Element = class Element {};
globalThis.KeyboardEvent = class KeyboardEvent {};

/* ---- react stub: enough to run the component bodies ------------------- */
const React = {
	Fragment: Symbol("Fragment"),
	createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
	useState: (init) => [typeof init === "function" ? init() : init, () => {}],
	useEffect: () => {},
};

/* ---- load the bundle the way the host does ---------------------------- */
new Function(source)();

assert.ok(captured, "the bundle did not call window.__ModuleLoader__.load");
assert.equal(captured.id, "dsh-ui-zoom");
assert.equal(typeof captured.factory, "function");

const mod = captured.factory((id) => {
	if (id === "react") return React;
	throw new Error(`unexpected require(${JSON.stringify(id)})`);
});

assert.equal(mod.name, "dsh-ui-zoom");
assert.deepEqual(mod.inject, ["slots", "locale"]);
assert.equal(typeof mod.apply, "function");

/* ---- apply it to a fake cordis context -------------------------------- */
let slot = null;
const ctx = {
	effect: (fn) => {
		const dispose = fn();
		return () => { if (typeof dispose === "function") dispose(); };
	},
	locale: {
		register: () => () => {},
		bind: () => (key) => key,
	},
	slots: {
		inject: (_name, callback) => callback(),
		register: (definition, component) => {
			slot = { definition, component };
			return () => {};
		},
	},
	inject: (_deps, callback) => callback({ shortcuts: null }),
};

mod.apply(ctx);
assert.ok(slot, "the plugin did not register into shell.overlay");
assert.equal(slot.definition.name, "shell.overlay");
assert.equal(slot.definition.id, "dsh-ui-zoom");

/* ---- render the overlay once with the stub ---------------------------- */
const tree = slot.component();
assert.ok(tree, "overlay rendered nothing");
const children = Array.isArray(tree.children) ? tree.children : [];
assert.equal(children.length, 2, "overlay should render the zoom HUD and the settings button");
for (const child of children) {
	assert.equal(typeof child.type, "function");
	child.type(child.props); // must not throw
}

console.log("smoke: ok");
