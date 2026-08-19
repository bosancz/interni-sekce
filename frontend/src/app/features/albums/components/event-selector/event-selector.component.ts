import { AfterViewInit, Component, ElementRef, forwardRef, input, OnInit, output, signal } from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { IonInput } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { SDK } from "src/sdk";
import { EventSelectorModalComponent } from "../event-selector-modal/event-selector-modal.component";

@Component({
	selector: "bo-event-selector",
	templateUrl: "./event-selector.component.html",
	styleUrls: ["./event-selector.component.scss"],
	imports: [IonInput, FormsModule, DateRangePipe],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: forwardRef(() => EventSelectorComponent),
		},
	],
})
export class EventSelectorComponent implements OnInit, ControlValueAccessor, AfterViewInit {
	value = signal<SDK.EventResponseWithLinks["id"] | null | undefined>(undefined);
	event = signal<SDK.EventResponseWithLinks | undefined>(undefined);

	placeholder = input<string>();
	eventOutput = output<SDK.EventResponseWithLinks>();

	onChange?: (value: SDK.EventResponseWithLinks["id"] | null) => void;
	onTouched?: () => void;

	focused = signal(false);
	disabled = signal(false);

	constructor(
		private modalService: ModalService,
		private api: ApiService,
		private elRef: ElementRef<HTMLElement>,
	) {}

	ngOnInit(): void {}

	ngAfterViewInit() {
		this.emitIonStyle();
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
					"has-value": !!this.value(),
					"has-focus": this.focused(),
					"interactive-disabled": this.disabled(),
				},
			}),
		);
	}

	inputValueChanged(value: string) {
		if (value === "") this.selectEvent(null);
	}

	async openModal() {
		const event = await this.modalService.componentModal(EventSelectorModalComponent, undefined, {
			cssClass: "dialog-list",
		});

		if (event) this.selectEvent(event);
	}

	private selectEvent(event: SDK.EventResponseWithLinks | null) {
		const id = event?.id ?? null;
		if (id === this.value()) return;

		this.value.set(id);
		this.event.set(event ?? undefined);

		this.onChange?.(id);
		if (event) this.eventOutput.emit(event);
		this.emitIonStyle();
	}

	private async loadEvent(eventId: SDK.EventResponseWithLinks["id"]) {
		return this.api.EventsApi.getEvent(eventId).then((res) => res.data);
	}

	async writeValue(eventId?: SDK.EventResponseWithLinks["id"] | null): Promise<void> {
		const value = eventId ?? null;
		if (value === this.value()) return;

		this.value.set(value);
		this.event.set(value ? await this.loadEvent(value) : undefined);
		this.emitIonStyle();
	}

	registerOnChange(fn: (value: SDK.EventResponseWithLinks["id"] | null) => void): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	setDisabledState(isDisabled: boolean) {
		this.disabled.set(isDisabled);
	}
}
