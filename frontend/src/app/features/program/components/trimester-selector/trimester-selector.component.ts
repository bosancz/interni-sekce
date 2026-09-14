import { Component, forwardRef, input, OnInit, signal } from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { IonInput, IonItem, IonLabel, IonSelect, IonSelectOption } from "@ionic/angular/standalone";
import { DateTime } from "luxon";

export type TrimesterDateRange = [string, string];

@Component({
	selector: "bo-trimester-selector",
	templateUrl: "./trimester-selector.component.html",
	styleUrls: ["./trimester-selector.component.scss"],

	imports: [FormsModule, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => TrimesterSelectorComponent),
			multi: true,
		},
	],
})
export class TrimesterSelectorComponent implements OnInit, ControlValueAccessor {
	lines = input<string | undefined>(undefined);
	labelPosition = input<string | undefined>(undefined);

	trimester = signal<number | undefined>(undefined);
	year = signal<number | undefined>(undefined);

	trimesterMonths = [
		[1, 4],
		[5, 8],
		[9, 12],
	];

	private onTouched = () => {};
	private onChange = (value: TrimesterDateRange) => {};
	disabled = signal(false);

	constructor() {
		this.setTrimesterByDate(DateTime.local());
	}

	writeValue(obj?: TrimesterDateRange): void {
		const dateFrom = obj?.[0];
		this.setTrimesterByDate(dateFrom ? DateTime.fromISO(dateFrom) : undefined);
	}
	registerOnChange(fn: any): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: any): void {
		this.onTouched = fn;
	}
	setDisabledState?(isDisabled: boolean): void {
		this.disabled.set(isDisabled);
	}

	ngOnInit(): void {}

	setTrimester() {
		const year = this.year();
		const trimester = this.trimester();
		if (!year || trimester === undefined) return;

		const dateFrom = DateTime.local(year, this.trimesterMonths[trimester][0], 1);
		const dateTill = DateTime.local(year, this.trimesterMonths[trimester][1], 1)
			.plus({ months: 1 })
			.minus({ days: 1 });

		const value: TrimesterDateRange = [dateFrom.toISODate()!, dateTill.toISODate()!];

		this.onChange(value);
		this.onTouched();
	}

	setTrimesterByDate(dateFrom?: DateTime) {
		if (!dateFrom || !dateFrom.isValid) dateFrom = DateTime.local();

		let year = dateFrom.year;
		let trimester = this.trimesterMonths.findIndex((item) => {
			return item[0] >= dateFrom!.month;
		});

		if (trimester === -1) {
			year++;
			trimester = 0;
		}

		this.year.set(year);
		this.trimester.set(trimester);

		this.setTrimester();
	}
}
