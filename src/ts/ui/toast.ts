/**
 * Minimal transient toast notification.
 *
 * Visual styling (background, radius, animation) lives in `custom.css` keyed off
 * `#app-toast`; a small set of positioning styles is applied inline as a
 * fallback so the toast is still readable if the stylesheet fails to load.
 */

const TOAST_ID = "app-toast";
const VISIBLE_MS = 1800;

/** Show a short-lived status message centered at the bottom of the viewport. */
export function showToast(message: string): void {
    if (typeof document === "undefined") {
        return;
    }

    // Replace any toast already on screen so messages don't stack.
    document.getElementById(TOAST_ID)?.remove();

    const toast = document.createElement("div");
    toast.id = TOAST_ID;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.textContent = message;
    toast.style.cssText =
        "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);" +
        "padding:8px 16px;z-index:9999;pointer-events:none";

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), VISIBLE_MS);
}
