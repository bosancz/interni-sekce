import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, computed, ElementRef, forwardRef, input, signal } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { EventTypeID, EventTypes } from "src/app/core/config/event-types";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";

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

	imports: [CommonModule, TooltipDirective],
})
export class EventTypeSelectorComponent implements ControlValueAccessor, AfterViewInit {
	value = signal<EventTypeID | undefined>(undefined);
	allowedTypes = input<EventTypeID[] | null>(null);
	types = computed(() => {
		const allowed = this.allowedTypes();
		return (Object.keys(EventTypes) as EventTypeID[])
			.filter((key) => !allowed || allowed.includes(key))
			.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
			.map((key) => ({ key, value: EventTypes[key] }));
	});

	onChange: any = () => {};
	onTouched: any = () => {};

	disabled = input<boolean>(false);
	readonly = input<boolean>(false);

	constructor(private elRef: ElementRef<HTMLElement>) {}

	ngAfterViewInit() {
		this.emitIonStyle();
	}

	typeLabel(typeId: string) {
		return typeId.charAt(0).toUpperCase() + typeId.slice(1);
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

	setDisabledState(isDisabled: boolean): void {}

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
