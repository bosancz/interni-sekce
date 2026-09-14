import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, ElementRef, forwardRef, input, OnInit } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { IonChip, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { addCircle, closeCircle } from "ionicons/icons";
import { ModalService } from "src/app/core/services/modal.service";
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

	imports: [CommonModule, IonChip, IonIcon],
})
export class MemberSelectorComponent implements OnInit, ControlValueAccessor, AfterViewInit {
	value: SDK.MemberResponse[] = [];

	members = input.required<SDK.MemberResponse[]>();
	placeholder = input<string | undefined>();
	multiple = input<boolean | string>(false);

	onChange?: (value: MemberSelectorType) => void;
	onTouched?: () => void;

	focused = false;
	disabled = false;

	constructor(
		private modalService: ModalService,
		private elRef: ElementRef<HTMLElement>,
	) {
		addIcons({ closeCircle, addCircle });
	}

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
		const multiple = this.multiple();
		if (!(multiple || multiple === "") && this.value.length >= 1) return;

		this.focused = true;
		this.emitIonStyle();

		const member = await this.modalService.componentModal(MemberSelectorModalComponent, {
			members: this.members(),
		});

		this.focused = false;
		if (member) this.addMember(member);
		this.emitIonStyle();
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

		const multiple = this.multiple();
		if (multiple || multiple === "") this.onChange?.(this.value);
		else this.onChange?.(this.value[0] || null);

		this.emitIonStyle();
	}

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
