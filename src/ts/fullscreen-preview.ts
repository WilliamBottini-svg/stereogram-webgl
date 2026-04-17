import "./page-interface-generated";

const PREVIEW_FIT_TABS = "preview-fit-tabs-id";
const BROWSER_FULLSCREEN_PREVIEW_CHECKBOX = "browser-fullscreen-preview-checkbox-id";

let overlay: HTMLDivElement | null = null;
let savedParent: HTMLElement | null = null;
let savedNextSibling: ChildNode | null = null;
let syncingCheckbox = false;
let stylesInjected = false;

function injectStyles(): void {
    if (stylesInjected) {
        return;
    }
    stylesInjected = true;
    const style = document.createElement("style");
    style.textContent = [
        ".stereogram-fs-overlay{",
        "background:#000;",
        "width:100%;",
        "height:100%;",
        "position:relative;",
        "display:flex;",
        "align-items:center;",
        "justify-content:center;",
        "}",
        ".stereogram-fs-overlay.stereogram-fs-fill{",
        "align-items:stretch;",
        "justify-content:stretch;",
        "}",
        ".stereogram-fs-overlay.stereogram-fs-fill #canvas{",
        "width:100%;",
        "height:100%;",
        "display:block;",
        "}",
        ".stereogram-fs-overlay.stereogram-fs-square #canvas{",
        "width:min(100vw,100vh);",
        "height:min(100vw,100vh);",
        "max-width:min(100vw,100vh);",
        "max-height:min(100vw,100vh);",
        "display:block;",
        "}",
        ".stereogram-fs-exit{",
        "position:absolute;",
        "top:12px;",
        "right:12px;",
        "z-index:2;",
        "padding:8px 14px;",
        "font:inherit;",
        "font-size:14px;",
        "cursor:pointer;",
        "color:#eee;",
        "background:rgba(40,40,40,.85);",
        "border:1px solid rgba(255,255,255,.25);",
        "border-radius:4px;",
        "}",
        ".stereogram-fs-exit:hover{background:rgba(60,60,60,.9);}",
    ].join("");
    document.head.appendChild(style);
}

function getFullscreenElement(): Element | null {
    const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
        mozFullScreenElement?: Element | null;
        msFullscreenElement?: Element | null;
    };
    if (doc.fullscreenElement) {
        return doc.fullscreenElement;
    }
    if (doc.webkitFullscreenElement) {
        return doc.webkitFullscreenElement;
    }
    if (doc.mozFullScreenElement) {
        return doc.mozFullScreenElement;
    }
    if (doc.msFullscreenElement) {
        return doc.msFullscreenElement;
    }
    return null;
}

function requestFs(el: HTMLElement): Promise<void> {
    const anyEl = el as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
        mozRequestFullScreen?: () => Promise<void> | void;
        msRequestFullscreen?: () => Promise<void> | void;
    };
    if (anyEl.requestFullscreen) {
        return Promise.resolve(anyEl.requestFullscreen());
    }
    if (anyEl.webkitRequestFullscreen) {
        return Promise.resolve(anyEl.webkitRequestFullscreen());
    }
    if (anyEl.mozRequestFullScreen) {
        return Promise.resolve(anyEl.mozRequestFullScreen());
    }
    if (anyEl.msRequestFullscreen) {
        return Promise.resolve(anyEl.msRequestFullscreen());
    }
    return Promise.reject(new Error("Fullscreen API unavailable"));
}

function exitFs(): void {
    const doc = document as Document & {
        webkitExitFullscreen?: () => void;
        mozCancelFullScreen?: () => void;
        msExitFullscreen?: () => void;
    };
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
    } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
    }
}

function isFillFit(): boolean {
    return Page.Tabs.getValues(PREVIEW_FIT_TABS)[0] === "fill";
}

function applyFitClass(): void {
    if (!overlay) {
        return;
    }
    overlay.classList.remove("stereogram-fs-square", "stereogram-fs-fill");
    overlay.classList.add(isFillFit() ? "stereogram-fs-fill" : "stereogram-fs-square");
}

function triggerCanvasResize(): void {
    window.dispatchEvent(new Event("resize"));
}

function setPreviewCheckbox(checked: boolean): void {
    if (Page.Checkbox.isChecked(BROWSER_FULLSCREEN_PREVIEW_CHECKBOX) === checked) {
        return;
    }
    syncingCheckbox = true;
    Page.Checkbox.setChecked(BROWSER_FULLSCREEN_PREVIEW_CHECKBOX, checked);
    syncingCheckbox = false;
}

function restoreCanvasFromOverlay(): void {
    const canvas = Page.Canvas.getCanvas();
    if (!canvas || !savedParent) {
        overlayCleanupDom();
        return;
    }
    if (canvas.parentElement !== savedParent) {
        if (savedNextSibling && savedNextSibling.parentNode === savedParent) {
            savedParent.insertBefore(canvas, savedNextSibling);
        } else {
            savedParent.appendChild(canvas);
        }
    }
    overlayCleanupDom();
    savedParent = null;
    savedNextSibling = null;
    triggerCanvasResize();
}

function overlayCleanupDom(): void {
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
    overlay = null;
}

function enterBrowserFullscreenPreview(): void {
    const canvas = Page.Canvas.getCanvas();
    if (!canvas || overlay) {
        return;
    }

    injectStyles();

    savedParent = canvas.parentElement;
    savedNextSibling = canvas.nextSibling;
    if (!savedParent) {
        return;
    }

    overlay = document.createElement("div");
    overlay.className = "stereogram-fs-overlay";
    applyFitClass();

    const exitBtn = document.createElement("button");
    exitBtn.type = "button";
    exitBtn.className = "stereogram-fs-exit";
    exitBtn.textContent = "Exit preview";
    exitBtn.addEventListener("click", () => {
        if (getFullscreenElement()) {
            exitFs();
        } else {
            restoreCanvasFromOverlay();
        }
        setPreviewCheckbox(false);
    });

    overlay.appendChild(exitBtn);
    overlay.appendChild(canvas);
    document.body.appendChild(overlay);

    requestFs(overlay).then(
        () => triggerCanvasResize(),
        () => {
            restoreCanvasFromOverlay();
            setPreviewCheckbox(false);
        },
    );
}

function exitBrowserFullscreenPreview(): void {
    if (getFullscreenElement()) {
        exitFs();
    } else {
        restoreCanvasFromOverlay();
    }
}

function onFullscreenChange(): void {
    const fsEl = getFullscreenElement();
    if (!fsEl && !syncingCheckbox) {
        restoreCanvasFromOverlay();
        setPreviewCheckbox(false);
    } else if (fsEl === overlay) {
        triggerCanvasResize();
    }
}

/**
 * Wires browser fullscreen preview: square vs fill, ESC / exit control, and checkbox UI sync.
 */
function initBrowserFullscreenPreview(): void {
    injectStyles();

    Page.Checkbox.addObserver(BROWSER_FULLSCREEN_PREVIEW_CHECKBOX, (checked: boolean) => {
        if (syncingCheckbox) {
            return;
        }
        if (checked) {
            enterBrowserFullscreenPreview();
        } else {
            exitBrowserFullscreenPreview();
        }
    });

    Page.Tabs.addObserver(PREVIEW_FIT_TABS, () => {
        applyFitClass();
        triggerCanvasResize();
    });

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("mozfullscreenchange", onFullscreenChange);
    document.addEventListener("MSFullscreenChange", onFullscreenChange);
}

export {
    initBrowserFullscreenPreview,
};
