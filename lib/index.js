//#region src/index.ts
/**
 * Host half of dsh-ui-zoom.
 *
 * The whole feature is browser-side: the zoom controller and the Settings
 * entry live in the client bundle. The host half exists only so the package
 * is a real Cordis plugin and can be inserted by the bundle patch.
 *
 * Plugin name; the profile patch inserts this id.
 */
const name = "dsh-ui-zoom";

/** Provides no host-side behavior. */
function apply() {}

export { apply, name };
//#endregion
