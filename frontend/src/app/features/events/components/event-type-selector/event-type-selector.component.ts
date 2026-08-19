import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, ElementRef, forwardRef, input, signal } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { EventTypeID, EventTypes } from "src/app/core/config/event-types";

@Component({
	selector: "bo-event-type-selector",
	templateUrl: "./event-type-selector.component.html",
	styleUrls: ["./event-type-selector.component.scss"],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: forwardRef(() => EventTypeSelectorComponent),
		},
	],
	host: {
		"[class.disabled]": "disabled",
		"[class.readonly]": "readonly",
	},

	imports: [CommonModule],
})
export class EventTypeSelectorComponent implements ControlValueAccessor, AfterViewInit {
	value = signal<EventTypeID | undefined>(undefined);
	types = EventTypes;

	onChange: any = () => {};
	onTouched: any = () => {};

	disabled = input<boolean>(false);
	readonly = input<boolean>(false);

	constructor(private elRef: ElementRef<HTMLElement>) {}

	ngAfterViewInit() {
		this.emitIonStyle();
	}

	select(typeId: EventTypeID) {
		if (this.disabled() || this.readonly()) return;
		this.value.set(typeId);
		this.onTouched();
		this.onChange(this.value());
	}

	writeValue(value?: EventTypeID) {
		this.value.set(value);
	}

	registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.onTouched = fn;
	}

	setDisabledState(isDisabled: boolean): void {
	}

	private emitIonStyle() {
		this.elRef.nativeElement.dispatchEvent(
			new CustomEvent("ionStyle", {
				bubbles: true,
				composed: true,
				cancelable: true,
				detail: {
					interactive: true,
					input: true,
					"has-placeholder": true,
					"has-value": true,
					"has-focus": false,
					"interactive-disabled": this.disabled(),
				},
			}),
		);
	}
}
