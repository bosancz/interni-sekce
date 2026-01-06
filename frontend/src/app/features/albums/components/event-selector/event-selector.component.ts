import { DatePipe } from "@angular/common";
import {
    AfterViewInit,
    Component,
    ElementRef,
    forwardRef,
    input,
    OnDestroy,
    OnInit,
    output,
    signal,
} from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";
import { ModalController } from "@ionic/angular";
import { IonInput } from "@ionic/angular/standalone";
import { ApiService } from "src/app/services/api.service";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { SDK } from "src/sdk";
import { EventSelectorModalComponent } from "../event-selector-modal/event-selector-modal.component";

@Component({
	selector: "bo-event-selector",
	templateUrl: "./event-selector.component.html",
	styleUrls: ["./event-selector.component.scss"],
	
	imports: [IonInput, FormsModule, DateRangePipe, DatePipe],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: forwardRef(() => EventSelectorComponent),
		},
	],
})
export class EventSelectorComponent implements OnInit, ControlValueAccessor, AfterViewInit, OnDestroy {
	value = signal<SDK.EventResponseWithLinks["id"] | null | undefined>(undefined);
	event = signal<SDK.EventResponseWithLinks | undefined>(undefined);

	placeholder = input<string>();
	eventOutput = output<SDK.EventResponseWithLinks>("event");

	modal?: HTMLIonModalElement;

	/* ControlValueAccessor */
	onChange?: (value: SDK.EventResponseWithLinks["id"] | null) => void;
	onTouched?: () => void;

	focused = signal(false);
	disabled = signal(false);

	constructor(
		private modalController: ModalController,
		private api: ApiService,
		private elRef: ElementRef<HTMLElement>,
	) {}

	ngOnInit(): void {}

	ngAfterViewInit() {
		this.emitIonStyle();
	}

	ngOnDestroy() {
		this.modal?.dismiss();
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
		if (value === "") this.updateValue(null);
	}

	async openModal() {
		this.modal = await this.modalController.create({
			component: EventSelectorModalComponent,
		});

		this.modal.onDidDismiss().then((result) => {
			if (result.data?.event !== undefined) this.updateValue(result.data?.event);
		});

		this.modal.present();
	}

	private async updateValue(value: SDK.EventResponseWithLinks["id"] | null) {
		if (value === this.value()) return;

		this.value.set(value);
		const event = value ? await this.loadEvent(value) : undefined;
		this.event.set(event);

		this.onChange?.(value);
		if (event) {
			this.eventOutput.emit(event);
		}
		this.emitIonStyle();
	}

	private async loadEvent(eventId: SDK.EventResponseWithLinks["id"]) {
		return this.api.EventsApi.getEvent(eventId).then((res) => res.data);
	}

	/* ControlValueAccessor */
	writeValue(obj?: SDK.EventResponseWithLinks["id"] | null): void {
		this.updateValue(obj || null);
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
