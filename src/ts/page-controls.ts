/**
 * Thin wrappers around the framework's `Page.*` setters/getters.
 *
 * The framework throws if a control ID is unknown. In normal operation every ID
 * in `control-ids.ts` exists, so a throw means a genuine bug (a renamed or
 * removed control). These wrappers keep a single bad ID from bricking the whole
 * boot sequence, but — unlike a bare `catch {}` — they log a warning so the bug
 * is still visible in the console rather than silently swallowed.
 */

import "./page-interface-generated";

function warn(action: string, id: string, error: unknown): void {
    console.warn(`[page-controls] ${action} failed for control "${id}":`, error);
}

export function setRangeSafe(id: string, value: number | undefined): void {
    if (value === undefined) {
        return;
    }
    try {
        Page.Range.setValue(id, value);
    } catch (e) {
        warn("setRange", id, e);
    }
}

export function setCheckboxSafe(id: string, value: boolean | undefined): void {
    if (value === undefined) {
        return;
    }
    try {
        Page.Checkbox.setChecked(id, value);
    } catch (e) {
        warn("setCheckbox", id, e);
    }
}

export function setTabsSafe(id: string, values: string[]): void {
    try {
        Page.Tabs.setValues(id, values);
    } catch (e) {
        warn("setTabs", id, e);
    }
}

export function setSelectSafe(id: string, value: string): void {
    try {
        Page.Select.setValue(id, value);
    } catch (e) {
        warn("setSelect", id, e);
    }
}

export function getSelectSafe(id: string): string | undefined {
    try {
        return Page.Select.getValue(id) ?? undefined;
    } catch (e) {
        warn("getSelect", id, e);
        return undefined;
    }
}
