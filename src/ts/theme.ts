/**
 * Light / dark theme toggle.
 *
 * Sources of truth (in priority order):
 *   1. Explicit user choice (persisted in localStorage)
 *   2. `prefers-color-scheme` media query
 *   3. Light (fallback)
 *
 * The active theme is written to `<html data-theme="light|dark">`. All visual
 * styling lives in CSS, keyed off the data attribute.
 *
 * Designed to be initialized as early as possible — ideally before first paint —
 * so there is no light-to-dark flash on dark-preferred systems.
 */

export type Theme = "light" | "dark";

const STORAGE_KEY = "stereogram-theme";
const TOGGLE_BUTTON_ID = "theme-toggle";

function readStoredTheme(): Theme | null {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        return v === "light" || v === "dark" ? v : null;
    } catch {
        return null;
    }
}

function writeStoredTheme(theme: Theme): void {
    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch {
        // ignore: private mode / disabled storage
    }
}

function systemTheme(): Theme {
    if (
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ) {
        return "dark";
    }
    return "light";
}

export function getActiveTheme(): Theme {
    return readStoredTheme() ?? systemTheme();
}

export function applyTheme(theme: Theme): void {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = theme;

    // Keep mobile browser chrome (URL bar background) in sync.
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) {
        meta.content = theme === "dark" ? "#0f1115" : "#f7f7f9";
    }

    updateToggleButton(theme);
}

function setTheme(theme: Theme): void {
    writeStoredTheme(theme);
    applyTheme(theme);
}

function toggleTheme(): void {
    setTheme(getActiveTheme() === "dark" ? "light" : "dark");
}

function updateToggleButton(theme: Theme): void {
    const btn = document.getElementById(TOGGLE_BUTTON_ID);
    if (!btn) return;
    btn.setAttribute("aria-pressed", String(theme === "dark"));
    btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
    btn.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
    btn.textContent = theme === "dark" ? "☀" : "☾";
}

/** Inject the dark-mode toggle button into the canvas controls column. */
export function installThemeToggle(): void {
    if (typeof document === "undefined") return;
    const column = document.getElementById("canvas-buttons-column");
    if (!column) return;
    if (document.getElementById(TOGGLE_BUTTON_ID)) return;

    const button = document.createElement("button");
    button.id = TOGGLE_BUTTON_ID;
    button.type = "button";
    button.className = "theme-toggle";
    button.addEventListener("click", toggleTheme);

    // Prepend so it sits above the gear / fullscreen toggles.
    column.insertBefore(button, column.firstChild);
    updateToggleButton(getActiveTheme());
}

/**
 * Wire up the theme system from the main bundle.
 *
 * The no-flash `<head>` script in index.html is what actually applies the theme
 * before first paint. By the time this runs the theme is already set; the
 * `applyTheme` call here is a defensive re-assert for the case where that inline
 * script failed (e.g. threw before completing). Its real job is registering the
 * live `prefers-color-scheme` listener, which the inline script does not do.
 */
export function initTheme(): void {
    applyTheme(getActiveTheme());

    // Live-react to OS theme changes IF the user hasn't made an explicit choice.
    if (typeof window !== "undefined" && window.matchMedia) {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = (): void => {
            if (readStoredTheme() === null) {
                applyTheme(systemTheme());
            }
        };
        // Older browsers used addListener; modern uses addEventListener.
        if (mq.addEventListener) {
            mq.addEventListener("change", onChange);
        }
    }
}
