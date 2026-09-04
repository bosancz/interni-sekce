import { Component, computed, OnInit, signal } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { addOutline, checkmarkOutline, closeOutline } from "ionicons/icons";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

export interface MemberContactFormData {
	relationship: string;
	name: string;
	mobile: string[];
	email: string[];
	other: string;
	isDefault: boolean;
}

@Component({
	selector: "bo-member-contact-modal",
	templateUrl: "./member-contact-modal.component.html",
	styleUrl: "./member-contact-modal.component.scss",
	imports: [IonIcon, ModalLayoutComponent],
})
export class MemberContactModalComponent extends InputModalComponent<MemberContactFormData> implements OnInit {
	contact?: SDK.MemberContactResponseWithLinks | null;

	relationship = signal("");
	name = signal("");
	mobile = signal<string[]>([""]);
	email = signal<string[]>([""]);
	other = signal("");
	isDefault = signal(false);

	error = signal<string | null>(null);

	isNew = computed(() => !this.contact);

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ addOutline, checkmarkOutline, closeOutline });
	}

	ngOnInit(): void {
		this.relationship.set(this.contact?.relationship ?? "");
		this.name.set(this.contact?.name ?? "");
		this.mobile.set(this.contact?.mobile?.length ? [...this.contact.mobile] : [""]);
		this.email.set(this.contact?.email?.length ? [...this.contact.email] : [""]);
		this.other.set(this.contact?.other ?? "");
		this.isDefault.set(!!this.contact?.isDefault);
	}

	setValue(field: "mobile" | "email", index: number, value: string) {
		this[field].update((values) => values.map((item, i) => (i === index ? value : item)));
	}

	addValue(field: "mobile" | "email") {
		this[field].update((values) => [...values, ""]);
	}

	removeValue(field: "mobile" | "email", index: number) {
		this[field].update((values) => {
			const remaining = values.filter((_, i) => i !== index);
			return remaining.length ? remaining : [""];
		});
	}

	save() {
		const relationship = this.relationship().trim();
		const mobile = this.cleanValues(this.mobile());
		const email = this.cleanValues(this.email());
		const other = this.other().trim();

		if (!relationship) {
			this.error.set("Chybí vztah");
			return;
		}

		if (!mobile.length && !email.length && !other) {
			this.error.set("Musí být vyplněn alespoň jeden kontakt");
			return;
		}

		this.submit.emit({
			relationship,
			name: this.name().trim(),
			mobile,
			email,
			other,
			isDefault: this.isDefault(),
		});
	}

	private cleanValues(values: string[]) {
		return values.map((value) => value.trim()).filter((value) => !!value);
	}
}
