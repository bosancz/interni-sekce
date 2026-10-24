import { Component, computed, OnInit, signal } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkOutline } from "ionicons/icons";
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
	| "datetime-local";

export interface BrandDialogInput {
	name: string;
	type?: BrandDialogInputType;
	label?: string;
	placeholder?: string;
	value?: string | number | null;
	required?: boolean;
	autocapitalize?: string;
}

export interface BrandDialogOption<T = any> {
	label: string;
	value: T;
	color?: string;
}

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

	values = signal<Record<string, string>>({});
	chosen = signal<any[]>([]);

	valid = computed(() => {
		const values = this.values();
		if (this.inputs.some((input) => input.required && !values[input.name]?.trim())) return false;
		if (this.options.length && !this.multiple && !this.chosen().length) return false;
		return true;
	});

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ checkmarkOutline });
	}

	ngOnInit() {
		this.values.set(
			Object.fromEntries(
				this.inputs.map((input) => [input.name, input.value == null ? "" : String(input.value)]),
			),
		);

		const selected = this.multiple ? (this.selected ?? []) : this.selected !== undefined ? [this.selected] : [];
		this.chosen.set(selected);
	}

	labelOf(input: BrandDialogInput) {
		if (input.label) return input.label;
		return input.type && ["date", "time", "datetime-local"].includes(input.type) ? input.placeholder : undefined;
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
