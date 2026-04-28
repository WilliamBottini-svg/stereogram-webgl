import "./page-interface-generated";

const SECTION_STORAGE_PREFIX = "stereogram-section-collapsed-";

function injectStyles(): void {
    const id = "stereogram-ui-enhancements-style";
    if (document.getElementById(id)) {
        return;
    }
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
.controls-section-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 7em;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    font-size: medium;
    font-weight: bold;
    line-height: 2em;
    text-align: left;
    cursor: pointer;
    color: inherit;
    font-family: inherit;
}
.controls-section-toggle:hover .controls-section-title {
    text-decoration: underline;
}
.controls-section-chevron {
    display: inline-block;
    width: 0.9em;
    flex-shrink: 0;
    font-size: 70%;
    opacity: 0.85;
    transition: transform 0.12s ease;
}
.controls-section.collapsed .controls-section-chevron {
    transform: rotate(-90deg);
}
.controls-section.collapsed > .controls-list {
    display: none;
}
.control > .range-value-input {
    width: 4.75em;
    flex-shrink: 0;
    margin-left: 6px;
    padding: 2px 4px;
    box-sizing: border-box;
    font-size: 95%;
    line-height: 1.2;
}
.control > .range-reset {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin-left: 4px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    color: inherit;
    opacity: 0.75;
}
.control > .range-reset:hover:not(:disabled) {
    opacity: 1;
    background: rgba(128, 128, 128, 0.15);
}
.control > .range-reset:disabled {
    cursor: default;
    opacity: 0.35;
}
.control > .range-reset svg {
    display: block;
}
`;
    document.head.appendChild(style);
}

function nbDecimals(x: number): number {
    const xAsString = x.toString();
    if (/^[0-9]+$/.test(xAsString)) {
        return 0;
    }
    if (/^[0-9]+\.[0-9]+$/.test(xAsString)) {
        return xAsString.length - (xAsString.indexOf(".") + 1);
    }
    return -1;
}

function getMaxNbDecimals(...numbers: number[]): number {
    let nbDecimalsOut = -1;
    for (const n of numbers) {
        if (n < 0) {
            return -1;
        }
        const local = nbDecimals(n);
        if (nbDecimalsOut < local) {
            nbDecimalsOut = local;
        }
    }
    return nbDecimalsOut;
}

function formatRangeValue(value: number, nbDecimalsToDisplay: number): string {
    if (nbDecimalsToDisplay < 0) {
        return String(value);
    }
    return value.toFixed(nbDecimalsToDisplay);
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function snapToStep(value: number, min: number, step: number): number {
    if (step <= 0 || isNaN(step)) {
        return value;
    }
    const steps = Math.round((value - min) / step);
    const snapped = min + steps * step;
    return parseFloat(snapped.toPrecision(12));
}

function valuesClose(a: number, b: number, step: number): boolean {
    const tol = Math.max(1e-9, Math.abs(step) * 1e-6);
    return Math.abs(a - b) <= tol;
}

function parseCommittedNumber(raw: string): number | null {
    const trimmed = raw.trim();
    if (trimmed === "") {
        return null;
    }
    const n = parseFloat(trimmed.replace(",", "."));
    if (isNaN(n)) {
        return null;
    }
    return n;
}

function dispatchRangeInputAndChange(rangeInput: HTMLInputElement): void {
    rangeInput.dispatchEvent(new Event("input", { bubbles: true }));
    rangeInput.dispatchEvent(new Event("change", { bubbles: true }));
}

function createResetButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "range-reset";
    button.title = "Reset to default";
    button.setAttribute("aria-label", "Reset to default");

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path1.setAttribute("d", "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8");
    const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path2.setAttribute("d", "M3 3v5h5");

    svg.appendChild(path1);
    svg.appendChild(path2);
    button.appendChild(svg);
    return button;
}

function enhanceRangeControls(): void {
    const controls = document.querySelectorAll(".control");
    const controlElements = Array.prototype.slice.call(controls) as HTMLElement[];
    for (const control of controlElements) {
        const rangeContainer = control.querySelector(".range-container");
        const rangeInput = control.querySelector("input[type=\"range\"]") as HTMLInputElement | null;
        if (!rangeContainer || !rangeInput || !rangeInput.id) {
            continue;
        }
        if (control.querySelector(".range-value-input")) {
            continue;
        }

        const min = +rangeInput.min;
        const max = +rangeInput.max;
        const step = +rangeInput.step;
        const nbDecimalsToDisplay = getMaxNbDecimals(min, max, step);

        const defaultValue = parseFloat(rangeInput.defaultValue);
        const safeDefault = isNaN(defaultValue) ? +rangeInput.value : defaultValue;

        const numberInput = document.createElement("input");
        numberInput.type = "number";
        numberInput.className = "range-value-input";
        numberInput.min = String(min);
        numberInput.max = String(max);
        numberInput.step = String(step);
        numberInput.value = formatRangeValue(+rangeInput.value, nbDecimalsToDisplay);

        const resetButton = createResetButton();

        rangeContainer.insertAdjacentElement("afterend", numberInput);
        numberInput.insertAdjacentElement("afterend", resetButton);

        const rangeId = rangeInput.id;

        const syncResetDisabled = (v: number) => {
            resetButton.disabled = valuesClose(v, safeDefault, step);
        };
        syncResetDisabled(+rangeInput.value);

        Page.Range.addObserver(rangeId, (v: number) => {
            numberInput.value = formatRangeValue(v, nbDecimalsToDisplay);
            syncResetDisabled(v);
        });

        const commitFromNumberField = () => {
            const parsed = parseCommittedNumber(numberInput.value);
            if (parsed === null) {
                numberInput.value = formatRangeValue(+rangeInput.value, nbDecimalsToDisplay);
                return;
            }
            const snapped = snapToStep(clamp(parsed, min, max), min, step);
            rangeInput.value = String(snapped);
            dispatchRangeInputAndChange(rangeInput);
        };

        numberInput.addEventListener("change", commitFromNumberField);
        numberInput.addEventListener("keydown", (ev: KeyboardEvent) => {
            if (ev.key === "Enter") {
                ev.preventDefault();
                commitFromNumberField();
                (numberInput as HTMLInputElement).blur();
            }
        });

        resetButton.addEventListener("click", () => {
            rangeInput.value = String(safeDefault);
            dispatchRangeInputAndChange(rangeInput);
        });
    }
}

function slugifySectionTitle(title: string): string {
    return title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "section";
}

function readSectionCollapsed(title: string): boolean {
    try {
        return window.localStorage.getItem(SECTION_STORAGE_PREFIX + slugifySectionTitle(title)) === "1";
    } catch {
        return false;
    }
}

function writeSectionCollapsed(title: string, collapsed: boolean): void {
    try {
        window.localStorage.setItem(SECTION_STORAGE_PREFIX + slugifySectionTitle(title), collapsed ? "1" : "0");
    } catch {
        /* ignore */
    }
}

function setupCollapsibleSections(): void {
    const sections = document.querySelectorAll("section.controls-section");
    const sectionElements = Array.prototype.slice.call(sections) as HTMLElement[];
    for (const section of sectionElements) {
        const h2 = section.querySelector(":scope > h2");
        const list = section.querySelector(":scope > .controls-list");
        if (!h2 || !list || section.querySelector(":scope > .controls-section-toggle")) {
            continue;
        }

        const rawTitle = h2.textContent;
        const titleText = rawTitle === null ? "" : rawTitle.trim();
        const collapsed = readSectionCollapsed(titleText);

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "controls-section-toggle";
        toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");

        const chevron = document.createElement("span");
        chevron.className = "controls-section-chevron";
        chevron.setAttribute("aria-hidden", "true");
        chevron.textContent = "\u25BE";

        const titleSpan = document.createElement("span");
        titleSpan.className = "controls-section-title";
        titleSpan.textContent = titleText;

        toggle.appendChild(chevron);
        toggle.appendChild(titleSpan);

        h2.parentNode!.insertBefore(toggle, h2);
        h2.remove();

        if (collapsed) {
            section.classList.add("collapsed");
        }

        toggle.addEventListener("click", () => {
            const isCollapsed = section.classList.toggle("collapsed");
            toggle.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
            writeSectionCollapsed(titleText, isCollapsed);
        });
    }
}

function applySectionCollapseFromStorageEarly(): void {
    const sections = document.querySelectorAll("section.controls-section");
    const sectionElements = Array.prototype.slice.call(sections) as HTMLElement[];
    for (const section of sectionElements) {
        const h2 = section.querySelector(":scope > h2");
        if (!h2) {
            continue;
        }
        const rawTitle = h2.textContent;
        const titleText = rawTitle === null ? "" : rawTitle.trim();
        if (readSectionCollapsed(titleText)) {
            section.classList.add("collapsed");
        }
    }
}

injectStyles();

if (document.body) {
    applySectionCollapseFromStorageEarly();
}

Page.Helpers.Events.callAfterDOMLoaded(() => {
    setupCollapsibleSections();
    enhanceRangeControls();
});
