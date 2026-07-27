import { Component, computed, forwardRef, input, output, signal } from "@angular/core";
import { IonContent, IonIcon, IonPopover } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { chevronDown } from "ionicons/icons";
import { STAGED_CONTROL, StagedControl } from "../staged-control";

export interface FilterPillOption {
	value: string;
	label: string;
	/** optional chip colours (e.g. event status colours) — tint when idle, solid when selected */
	background?: string;
	foreground?: string;
	/** single chip colour (e.g. group colour) — the tint is derived from it, solid when selected */
	color?: string;
	/** compact label shown in the pill button when a single-select pill has this option selected (e.g. group short code) */
	shortLabel?: string;
}

/**
 * Filter pill styled like the events "Rok" pill: a rounded button next to the search box that
 * opens a popover with a grid of toggleable chips. Drop it inside <bo-filter> with the
 * `toolbar-actions slot="end"` attributes so it is projected into the toolbar.
 *
 * Inline (desktop) the pill applies immediately — every toggle emits `selectedChange`. Inside the
 * mobile filter modal `<bo-filter>` puts the pill into *staging* mode via {@link beginStaging}: the
 * toggles then only build up a local draft and nothing is emitted (so the list behind the modal is
 * left untouched) until the modal is confirmed, at which point {@link commit} emits the draft. A
 * cancelled modal calls {@link cancel} and the draft is dropped.
 */
@Component({
	selector: "bo-filter-pill",
	templateUrl: "./filter-pill.component.html",
	styleUrls: ["./filter-pill.component.scss"],
	imports: [IonIcon, IonPopover, IonContent],
	providers: [{ provide: STAGED_CONTROL, useExisting: forwardRef(() => FilterPillComponent) }],
})
export class FilterPillComponent implements StagedControl {
	label = input.required<string>();
	options = input<FilterPillOption[]>([]);
	selected = input<string[]>([]);
	// single-select pills replace the value and close on pick; multi-select toggle chips
	multiple = input<boolean>(true);
	// number of chip columns in the popover grid (1 = stacked single column)
	columns = input<number>(1);
	selectedChange = output<string[]>();

	popoverOpen = signal(false);
	popoverEvent = signal<Event | undefined>(undefined);

	// While staging, toggles write here instead of emitting; null means "not staging" (apply live).
	private draft = signal<string[] | null>(null);

	// The selection the pill should display and act on: the local draft while staging, otherwise the
	// committed value from the `selected` input.
	private effectiveSelected = computed(() => this.draft() ?? this.selected());

	/**
	 * Text shown in the pill button. Single-select pills show the selected option's short code (or
	 * label) instead of a count, since there can only ever be one; multi-select pills show a count.
	 */
	buttonLabel = computed(() => {
		const selected = this.effectiveSelected();
		if (!selected.length) return this.label();

		if (selected.length === 1) {
			const option = this.options().find((item) => item.value === selected[0]);
			if (option) return `${this.label()}: ${option.shortLabel ?? option.label}`;
		}

		return `${this.label()} (${selected.length})`;
	});

	constructor() {
		addIcons({ chevronDown });
	}

	open(event: Event) {
		this.popoverEvent.set(event);
		this.popoverOpen.set(true);
	}

	isSelected(value: string): boolean {
		return this.effectiveSelected().includes(value);
	}

	toggle(value: string) {
		const current = this.effectiveSelected();
		const next = current.includes(value)
			? current.filter((item) => item !== value)
			: this.multiple()
				? [...current, value]
				: [value];

		if (!this.multiple()) this.popoverOpen.set(false);

		this.apply(next);
	}

	clear() {
		this.apply([]);
	}

	done() {
		this.popoverOpen.set(false);
	}

	// --- staging, driven by the parent <bo-filter> around the mobile filter modal ---

	/** Enter staging: start buffering toggles from the current committed selection. Idempotent, so
	 * the parent can (re-)seed pills as they render into the modal without wiping in-progress edits. */
	beginStaging() {
		if (this.draft() === null) this.draft.set([...this.selected()]);
	}

	/** Confirm staging: emit the draft (if it changed anything) and return to live mode. */
	commit() {
		const draft = this.draft();
		this.draft.set(null);
		if (draft && !this.sameSelection(draft, this.selected())) this.selectedChange.emit(draft);
	}

	/** Abort staging: drop the draft and return to live mode without emitting. */
	cancel() {
		this.draft.set(null);
	}

	// Route a new selection to the draft while staging, or straight out as an emit when live.
	private apply(next: string[]) {
		if (this.draft() === null) this.selectedChange.emit(next);
		else this.draft.set(next);
	}

	private sameSelection(a: string[], b: string[]): boolean {
		return a.length === b.length && a.every((value) => b.includes(value));
	}
}
