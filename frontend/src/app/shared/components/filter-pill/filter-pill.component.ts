import { Component, computed, input, output, signal } from "@angular/core";
import { IonContent, IonIcon, IonPopover } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { chevronDown } from "ionicons/icons";

export interface FilterPillOption {
	value: string;
	label: string;
	background?: string;
	foreground?: string;
	color?: string;
	shortLabel?: string;
}

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
	multiple = input<boolean>(true);
	columns = input<number>(1);
	selectedChange = output<string[]>();

	popoverOpen = signal(false);
	popoverEvent = signal<Event | undefined>(undefined);

	buttonLabel = computed(() => {
		const selected = this.selected();
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

	done() {
		this.popoverOpen.set(false);
	}
}
