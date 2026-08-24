import { Component, forwardRef, input, signal } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

@Component({
	selector: "list-slider",
	templateUrl: "./list-slider.component.html",
	styleUrls: ["./list-slider.component.scss"],

	imports: [],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: forwardRef(() => ListSliderComponent),
		},
	],
})
export class ListSliderComponent implements ControlValueAccessor {
	items = input<any[]>([]);
	visible = input<number>(3);
	itemWidth = input<number>(40);

	arrows = input<boolean>(true);

	value = signal<any>(undefined);

	disabled = signal(false);

	onChange = (value: any) => {};
	onTouched = () => {};

	constructor() {}

	getI(): number {
		return this.items().indexOf(this.value());
	}
	getLeft() {
		return (this.getI() + 0.5) * this.itemWidth();
	}

	getOpacity(i: number) {
		return Math.max(1 - (1 / this.visible()) * Math.abs(this.getI() - i), 0);
	}

	nextItem() {
		const items = this.items();
		const i = this.getI();
		if (i + 1 < items.length) this.setValue(items[i + 1]);
	}

	prevItem() {
		const i = this.getI();
		if (i - 1 >= 0) {
			const items = this.items();
			this.setValue(items[i - 1]);
		}
	}

	setValue(value: any) {
		this.value.set(value);
		this.onChange(this.value());
	}

	writeValue(value: any): void {
		this.value.set(value);
	}

	registerOnChange(fn: (value: any) => void): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.onTouched = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this.disabled.set(isDisabled);
	}
}
