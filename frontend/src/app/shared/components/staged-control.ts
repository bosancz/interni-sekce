import { InjectionToken } from "@angular/core";

/**
 * A control inside the filter modal that can defer its change until the modal is confirmed.
 *
 * Inline (desktop) these controls apply immediately. Inside the mobile filter modal `<bo-filter>`
 * puts every projected `STAGED_CONTROL` into staging: edits only build a local draft and nothing is
 * emitted, so the list behind the modal is left untouched until "Hotovo" commits the drafts (or a
 * cancel drops them). This keeps every control type — pills, the sort select, toggles — consistent
 * regardless of whether the page stores its filters in the URL or in local state.
 */
export interface StagedControl {
	/** Start buffering edits from the current value; nothing is emitted until {@link commit}. */
	beginStaging(): void;
	/** Emit the buffered draft (only if it changed anything) and return to live mode. */
	commit(): void;
	/** Drop the buffered draft and return to live mode without emitting. */
	cancel(): void;
}

export const STAGED_CONTROL = new InjectionToken<StagedControl>("STAGED_CONTROL");
