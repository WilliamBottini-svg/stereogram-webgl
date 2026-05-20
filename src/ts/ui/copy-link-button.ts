/**
 * "Copy link" button injected into the canvas controls column. Copies the
 * current page URL (which carries the full configuration in its hash — see
 * `url-state.ts`) to the clipboard and confirms with a toast.
 */

import { showToast } from "./toast";

function copyToClipboard(text: string): Promise<void> | void {
    if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(text);
    }
    // Fallback for browsers without the async clipboard API.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
}

/** Inject the Copy-link button. No-op if the host column is missing. */
export function installCopyLinkButton(): void {
    if (typeof document === "undefined") {
        return;
    }
    const column = document.getElementById("canvas-buttons-column");
    if (!column || document.getElementById("copy-link-button")) {
        return;
    }

    const button = document.createElement("button");
    button.id = "copy-link-button";
    button.type = "button";
    // Visible text "Copy link" is the accessible name; title adds a fuller hint.
    button.title = "Copy a shareable link to the current configuration";
    button.textContent = "Copy link";

    button.addEventListener("click", () => {
        Promise.resolve(copyToClipboard(window.location.href))
            .then(() => showToast("Link copied"))
            .catch(() => showToast("Copy failed"));
    });

    column.appendChild(button);
}
