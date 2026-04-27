import { Component, forwardRef, input, OnInit } from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { IonInput, IonItem, IonLabel } from "@ionic/angular/standalone";
import { DateTime } from "luxon";

export type SchoolYearDateRange = [string, string];

@Component({
	selector: "bo-school-year-selector",
	templateUrl: "./school-year-selector.component.html",
	styleUrls: ["./school-year-selector.component.scss"],

	imports: [FormsModule, IonItem, IonLabel, IonInput],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => SchoolYearSelectorComponent),
			multi: true,
		},
	],
})
export class SchoolYearSelectorComponent implements OnInit, ControlValueAccessor {
	lines = input<string | undefined>(undefined);
	labelPosition = input<string | undefined>(undefined);

	year?: number; // The year when the school year starts (e.g., 2024 for 2024/2025)

	/* ControlValueAccessor, implements the ngModel interface */
	private onTouched = () => {};
	private onChange = (value: SchoolYearDateRange) => {};
	disabled: boolean = false;

	constructor() {
		this.setYearByDate(DateTime.local());
	}

	/* ControlValueAccessor, implements the ngModel interface */
	writeValue(obj?: SchoolYearDateRange): void {
		const dateFrom = obj?.[0];
		this.setYearByDate(dateFrom ? DateTime.fromISO(dateFrom) : undefined);
	}
	registerOnChange(fn: any): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: any): void {
		this.onTouched = fn;
	}
	setDisabledState?(isDisabled: boolean): void {
		this.disabled = isDisabled;
	}

	ngOnInit(): void {}

	setSchoolYear() {
		if (!this.year) return;

		// School year starts in September of the given year
		const dateFrom = DateTime.local(this.year, 9, 1);
		// School year ends in August of the next year
		const dateTill = DateTime.local(this.year + 1, 8, 31);

		const value: SchoolYearDateRange = [dateFrom.toISODate()!, dateTill.toISODate()!];

		this.onChange(value);
		this.onTouched();
	}

	setYearByDate(dateFrom?: DateTime) {
		if (!dateFrom || !dateFrom.isValid) dateFrom = DateTime.local();

		// If we're before September, use the previous year as the school year start
		if (dateFrom.month < 9) {
			this.year = dateFrom.year - 1;
		} else {
			this.year = dateFrom.year;
		}

		this.setSchoolYear();
	}
}
