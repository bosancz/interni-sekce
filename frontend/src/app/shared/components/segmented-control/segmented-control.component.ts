import { Component, input, output } from "@angular/core";

export interface SegmentedControlOption<T = string> {
	value: T;
	label: string;
}

@Component({
	selector: "bo-segmented-control",
	templateUrl: "./segmented-control.component.html",
	styleUrl: "./segmented-control.component.scss",
})
export class SegmentedControlComponent<T = string> {
	options = input.required<SegmentedControlOption<T>[]>();
	value = input<T | null | undefined>();
	disabled = input(false);
	label = input<string>();

	valueChange = output<T>();

	select(value: T) {
		if (this.disabled() || value === this.value()) return;
		this.valueChange.emit(value);
	}
}
