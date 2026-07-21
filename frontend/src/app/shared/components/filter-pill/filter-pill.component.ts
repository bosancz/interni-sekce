import { Component, computed, input, output, signal } from "@angular/core";
import { IonContent, IonIcon, IonPopover } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { chevronDown } from "ionicons/icons";

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
 */
@Component({
	selector: "bo-filter-pill",
	templateUrl: "./filter-pill.component.html",
	styleUrls: ["./filter-pill.component.scss"],
	imports: [IonIcon, IonPopover, IonContent],
})
export class FilterPillComponent {
	label = input.required<string>();
	options = input<FilterPillOption[]>([]);
	selected = input<string[]>([]);
	// single-select pills replace the value and close on pick; multi-select toggle chips
	multiple = input<boolean>(true);
	// stack chips in one column instead of a wrapping grid
	singleColumn = input<boolean>(false);
	selectedChange = output<string[]>();

	popoverOpen = signal(false);
	popoverEvent = signal<Event | undefined>(undefined);

	/**
	 * Text shown in the pill button. Single-select pills show the selected option's short code (or
	 * label) instead of a count, since there can only ever be one; multi-select pills show a count.
	 */
	buttonLabel = computed(() => {
		const selected = this.selected();
		if (!selected.length) return this.label();

		if (!this.multiple() && selected.length === 1) {
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
		return this.selected().includes(value);
	}

	toggle(value: string) {
		const current = this.selected();

		if (!this.multiple()) {
			this.selectedChange.emit(current.includes(value) ? [] : [value]);
			this.popoverOpen.set(false);
			return;
		}

		this.selectedChange.emit(
			current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
		);
	}

	clear() {
		this.selectedChange.emit([]);
	}
}
