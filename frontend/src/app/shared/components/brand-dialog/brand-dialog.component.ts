import { Component, computed, OnInit, signal } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkOutline, eyeOffOutline, eyeOutline } from "ionicons/icons";
import { InputModalComponent } from "src/app/core/services/input-modal";
import { ModalLayoutComponent } from "../modal-layout/modal-layout.component";

export type BrandDialogInputType =
	| "text"
	| "textarea"
	| "number"
	| "date"
	| "email"
	| "password"
	| "tel"
	| "url"
	| "search"
	| "time"
	| "datetime-local"
	| "date-range";

export interface BrandDialogInput {
	name: string;
	type?: BrandDialogInputType;
	label?: string;
	placeholder?: string;
	value?: string | number | [string | null | undefined, string | null | undefined] | null;
	required?: boolean;
	autocapitalize?: string;
}

export interface BrandDialogOption<T = any> {
	label: string;
	value: T;
	color?: string;
}

const isFullDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number(value.slice(0, 4)) >= 1900;

@Component({
	selector: "bo-brand-dialog",
	templateUrl: "./brand-dialog.component.html",
	styleUrl: "./brand-dialog.component.scss",
	imports: [IonIcon, ModalLayoutComponent],
})
export class BrandDialogComponent extends InputModalComponent<any> implements OnInit {
	header?: string;
	message?: string;
	inputs: BrandDialogInput[] = [];
	options: BrandDialogOption[] = [];
	multiple = false;
	selected?: any;
	cancelText: string | null = "Zrušit";
	confirmText = "Pokračovat";
	destructive = false;
	large = false;

	values = signal<Record<string, any>>({});
	chosen = signal<any[]>([]);
	revealed = signal<string[]>([]);

	valid = computed(() => {
		const values = this.values();
		if (this.inputs.some((input) => input.required && !this.isFilled(input, values[input.name]))) return false;
		if (this.options.length && !this.multiple && !this.chosen().length) return false;
		return true;
	});

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ checkmarkOutline, eyeOutline, eyeOffOutline });
	}

	ngOnInit() {
		this.values.set(Object.fromEntries(this.inputs.map((input) => [input.name, this.initialValue(input)])));

		const selected = this.multiple ? (this.selected ?? []) : this.selected !== undefined ? [this.selected] : [];
		this.chosen.set(selected);
	}

	private initialValue(input: BrandDialogInput) {
		if (input.type === "date-range") {
			const [from, till] = Array.isArray(input.value) ? input.value : [];
			return [from ?? "", till ?? ""];
		}
		return input.value == null ? "" : String(input.value);
	}

	private isFilled(input: BrandDialogInput, value: any) {
		if (input.type === "date-range") return !!value?.[0] && !!value?.[1];
		return !!value?.trim();
	}

	setRange(name: string, index: 0 | 1, value: string) {
		this.values.update((values) => {
			const range: [string, string] = [...(values[name] ?? ["", ""])] as [string, string];
			range[index] = value;
			if (index === 0 && isFullDate(value) && (!range[1] || range[1] < value)) range[1] = value;
			return { ...values, [name]: range };
		});
	}

	labelOf(input: BrandDialogInput) {
		if (input.label) return input.label;
		return input.type && ["date", "time", "datetime-local"].includes(input.type) ? input.placeholder : undefined;
	}

	inputType(input: BrandDialogInput) {
		if (input.type === "password" && this.revealed().includes(input.name)) return "text";
		return input.type ?? "text";
	}

	toggleReveal(name: string) {
		this.revealed.update((revealed) =>
			revealed.includes(name) ? revealed.filter((item) => item !== name) : [...revealed, name],
		);
	}

	setValue(name: string, value: string) {
		this.values.update((values) => ({ ...values, [name]: value }));
	}

	isChosen(option: BrandDialogOption) {
		return this.chosen().includes(option.value);
	}

	choose(option: BrandDialogOption) {
		if (!this.multiple) return this.chosen.set([option.value]);

		this.chosen.update((chosen) =>
			chosen.includes(option.value)
				? chosen.filter((value) => value !== option.value)
				: [...chosen, option.value],
		);
	}

	confirm() {
		if (!this.valid()) return;

		if (this.options.length) this.submit.emit(this.multiple ? this.chosen() : this.chosen()[0]);
		else if (this.inputs.length) this.submit.emit(this.values());
		else this.submit.emit(true);
	}

	onEnter(event: Event, input: BrandDialogInput) {
		if (input.type === "textarea") return;
		event.preventDefault();
		this.confirm();
	}
}
