import { createRequire } from "node:module";

const name = "dsh-ui-zoom";
const ROUTE = "/dsh-ui-zoom/zoom";
const MIN = 0.6;
const MAX = 1.8;

/** Electron windows for native page zoom; null outside the desktop host. */
function zoomWindows() {
	try {
		const require = createRequire(import.meta.url);
		const electron = require("electron");
		if (!electron || !electron.BrowserWindow) return null;
		const list = electron.BrowserWindow.getAllWindows().filter((win) => win && !win.isDestroyed());
		return list.length > 0 ? list : null;
	} catch {
		return null;
	}
}

function clampFactor(value) {
	const num = Number(value);
	if (!Number.isFinite(num)) return 1;
	return Math.min(MAX, Math.max(MIN, Math.round(num * 100) / 100));
}

function sendJson(response, status, payload) {
	response.writeHead(status, {
		"cache-control": "no-store",
		"content-type": "application/json; charset=utf-8",
	});
	response.end(JSON.stringify(payload));
}

/** Only the local host may drive the window zoom. */
function allowed(request) {
	const remote = request.socket && request.socket.remoteAddress ? String(request.socket.remoteAddress) : "";
	if (remote === "127.0.0.1" || remote === "::1" || remote === "::ffff:127.0.0.1") return true;
	const host = typeof request.headers.host === "string" ? request.headers.host : "";
	const origin = request.headers.origin;
	try {
		return typeof origin === "string" && origin !== "" && origin !== "null" && new URL(origin).host === host;
	} catch {
		return false;
	}
}

function apply(ctx) {
	ctx.inject(["webServer"], (host) => {
		host.effect(() => host.webServer.register({
			kind: "exact",
			path: ROUTE,
			handler: async (request, response) => {
				if (!allowed(request)) {
					sendJson(response, 403, { ok: false, error: "cross-origin request rejected" });
					return;
				}
				const windows = zoomWindows();
				if (!windows) {
					// Plain `dsh web`: no Electron bridge. The client then leaves
					// Ctrl+wheel to the browser's own page zoom.
					sendJson(response, 200, { ok: false, supported: false });
					return;
				}
				if (request.method === "GET") {
					let factor = 1;
					try {
						const contents = windows[0] && windows[0].webContents;
						if (contents) factor = contents.getZoomFactor();
					} catch { /* ignore */ }
					sendJson(response, 200, { ok: true, supported: true, factor });
					return;
				}
				if (request.method !== "POST") {
					response.writeHead(405, { allow: "GET, POST" });
					response.end();
					return;
				}
				let factor = 1;
				try {
					const chunks = [];
					for await (const chunk of request) chunks.push(chunk);
					const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
					factor = clampFactor(body && body.factor);
				} catch {
					sendJson(response, 400, { ok: false, error: "invalid body" });
					return;
				}
				let applied = 0;
				for (const win of windows) {
					try {
						win.webContents.setZoomFactor(factor);
						applied += 1;
					} catch { /* window may be closing */ }
				}
				sendJson(response, 200, { ok: true, supported: true, factor, applied });
			},
		}, "dsh-ui-zoom: native zoom"));
	});
}

export { apply, name };
