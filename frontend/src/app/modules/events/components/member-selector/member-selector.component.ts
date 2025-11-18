import { AfterViewInit, Component, ElementRef, forwardRef, Input, OnDestroy, OnInit } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { ModalController } from "@ionic/angular";
import { ApiService } from "src/app/services/api.service";
import { SDK } from "src/sdk";
import { MemberSelectorModalComponent } from "../member-selector-modal/member-selector-modal.component";

export type MemberSelectorType = SDK.MemberResponse | SDK.MemberResponse[] | null;

@Component({
	selector: "bo-member-selector",
	templateUrl: "./member-selector.component.html",
	styleUrls: ["./member-selector.component.scss"],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: forwardRef(() => MemberSelectorComponent),
		},
	],
	host: {
		"(click)": "openModal(); $event.stopPropagation()",
	},
	standalone: false,
})
export class MemberSelectorComponent implements OnInit, ControlValueAccessor, AfterViewInit, OnDestroy {
	value: SDK.MemberResponse[] = [];

	@Input() members!: SDK.MemberResponse[];

	@Input() placeholder?: string;
	@Input() multiple: boolean | string = false;

	modal?: HTMLIonModalElement;

	/* ControlValueAccessor */
	onChange?: (value: MemberSelectorType) => void;
	onTouched?: () => void;

	focused = false;
	disabled = false;

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
					"has-placeholder": false,
					"has-value": this.value.length > 0,
					"has-focus": this.focused,
					"interactive-disabled": this.disabled,
				},
			}),
		);
	}

	inputValueChanged(value: string) {
		if (value === "") this.updateValue(null);
	}

	async openModal() {
		if (!(this.multiple || this.multiple === "") && this.value.length >= 1) return;

		this.focused = true;
		this.emitIonStyle();

		this.modal = await this.modalController.create({
			component: MemberSelectorModalComponent,
			componentProps: {
				members: this.members,
			},
		});

		this.modal.onDidDismiss().then((result) => {
			this.focused = false;
			if (result.data?.member !== undefined) this.addMember(result.data.member);
			this.emitIonStyle();
		});

		this.modal.present();
	}

	addMember(member: SDK.MemberResponse) {
		const i = this.value.findIndex((item) => item.id === member.id);
		if (i !== -1) return;
		return this.updateValue([...this.value, member]);
	}

	removeMember(member: SDK.MemberResponse) {
		const i = this.value.findIndex((item) => item.id === member.id);
		if (i === -1) return;

		const members = this.value.slice();
		members.splice(i, 1);
		this.updateValue(members);
	}

	private async updateValue(value: MemberSelectorType) {
		if (this.value === value) return;

		if (!value) value = [];
		if (!Array.isArray(value)) value = [value];

		this.value = value;

		if (this.multiple || this.multiple === "") this.onChange?.(this.value);
		else this.onChange?.(this.value[0] || null);

		this.emitIonStyle();
	}

	/* ControlValueAccessor */
	writeValue(obj?: MemberSelectorType): void {
		this.updateValue(obj || null);
	}

	registerOnChange(fn: (value: MemberSelectorType) => void): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	setDisabledState(isDisabled: boolean) {
		this.disabled = isDisabled;
	}
}
