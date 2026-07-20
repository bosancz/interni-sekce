import { Component, effect, input, output, signal } from "@angular/core";
import {
	AlertButton,
	AlertController,
	IonButtons,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonSkeletonText,
} from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { callOutline, informationCircleOutline, mailOutline, personOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { AddButtonComponent } from "src/app/shared/components/add-button/add-button.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { CopyButtonComponent } from "src/app/shared/components/copy-button/copy-button.component";
import { DeleteButtonComponent } from "src/app/shared/components/delete-button/delete-button.component";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "bo-member-contacts",
	templateUrl: "./member-contacts.component.html",
	styleUrls: ["./member-contacts.component.scss"],
	imports: [
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		IonList,
		IonItem,
		IonIcon,
		IonLabel,
		IonSkeletonText,
		IonButtons,
		AddButtonComponent,
		CopyButtonComponent,
		DeleteButtonComponent,
	],
})
export default class MemberContactsComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
	update = output<Partial<SDK.MemberResponse>>();

	contacts = signal<SDK.MemberContactResponseWithLinks[] | undefined>(undefined);

	constructor(
		private toastService: ToastService,
		private api: ApiService,
		private alertController: AlertController,
		private modalService: ModalService,
	) {
		addIcons({ callOutline, mailOutline, informationCircleOutline, personOutline });
		effect(() => {
			const member = this.member();
			this.loadContacts(member?.id ?? null);
		});
	}

	async loadContacts(memberId: number | null) {
		if (!memberId) {
			this.contacts.set([]);
		} else {
			this.contacts.set(await this.api.MembersApi.listContacts(memberId).then((res) => res.data));
		}
	}

	async editAddress() {
		const member = this.member();
		const data = await this.modalService.inputModal({
			header: "Upravit adresu",
			inputs: {
				addressStreet: {
					type: "text",
					placeholder: "Ulice",
					value: member?.addressStreet,
				},
				addressStreetNo: {
					type: "text",
					placeholder: "Číslo popisné",
					value: member?.addressStreetNo,
				},
				addressCity: {
					type: "text",
					placeholder: "Město",
					value: member?.addressCity,
				},
				addressPostalCode: {
					type: "text",
					placeholder: "PSČ",
					value: member?.addressPostalCode,
				},
				addressCountry: {
					type: "text",
					placeholder: "Země",
					value: member?.addressCountry,
				},
			},
		});

		if (data) this.update.emit(data);
	}

	getFullAddress(member: SDK.MemberResponseWithLinks) {
		const addressLines = [
			`${member.addressStreet ?? ""}${member.addressStreetNo ? ` ${member.addressStreetNo}` : ""}`,
			member.addressCity,
			member.addressPostalCode,
		];

		if (member.addressCountry) {
			addressLines.push(member.addressCountry);
		}
		return addressLines.filter((line) => !!line).join("\n");
	}

	async editMobile() {
		const member = this.member();
		const data = await this.modalService.inputModal({
			header: "Upravit telefonní číslo",
			inputs: {
				mobile: { type: "tel", placeholder: "Telefonní číslo", value: member?.mobile },
			},
		});

		if (data !== null) this.update.emit(data);
	}

	async editEmail() {
		const member = this.member();
		const data = await this.modalService.inputModal({
			header: "Upravit email",
			inputs: {
				email: { type: "email", placeholder: "Email", value: member?.email },
			},
		});

		if (data !== null) this.update.emit(data);
	}

	async openContactForm(contact: SDK.MemberContactResponseWithLinks | null) {
		const buttons: AlertButton[] = [
			{
				text: "Zrušit",
				role: "cancel",
			},
			{
				text: contact ? "Uložit" : "Přidat",
				handler: async (data) => {
					if (!data.relationship) {
						this.toastService.toast("Chybí vztah", { color: "danger" });
						return false;
					} else if (!data.email && !data.mobile && !data.other) {
						this.toastService.toast("Musí být vyplněn alespoň jeden kontakt", { color: "danger" });
						return false;
					} else {
						await this.saveContact(contact?.id ?? null, data);
					}
				},
			},
		];

		const alert = await this.alertController.create({
			header: contact ? "Upravit kontakt" : "Přidat kontakt",
			inputs: [
				{
					name: "relationship",
					type: "text",
					attributes: {
						required: true,
					},
					placeholder: "Vztah",
					value: contact?.relationship,
				},
				{
					name: "name",
					type: "text",
					placeholder: "Jméno",
					value: contact?.name,
				},
				{
					name: "email",
					type: "email",
					placeholder: "Email",
					value: contact?.email,
				},
				{
					name: "mobile",
					type: "tel",
					placeholder: "Mobil",
					value: contact?.mobile,
				},
				{
					name: "other",
					type: "text",
					placeholder: "Jiný",
					value: contact?.other,
				},
			],
			buttons,
		});

		await alert.present();
	}

	private async saveContact(
		contactId: number | null,
		data: { relationship: string; name?: string; email?: string; mobile?: string; other?: string },
	) {
		const member = this.member();
		if (!member) return;

		if (contactId) {
			const { data: updated } = await this.api.MembersApi.updateContact(member.id, contactId, data);
			this.contacts.set(
				(this.contacts() ?? []).map((c) => (c.id === contactId ? (updated as SDK.MemberContactResponseWithLinks) : c)),
			);
		} else {
			const { data: created } = await this.api.MembersApi.createContact(member.id, data);
			this.contacts.set([...(this.contacts() ?? []), created as SDK.MemberContactResponseWithLinks]);
		}

		await this.toastService.toast(contactId ? "Kontakt byl upraven" : "Kontakt byl přidán");
	}

	async deleteContact(contact: SDK.MemberContactResponseWithLinks) {
		const member = this.member();
		if (!member) return;

		const confirmation = await this.modalService.deleteConfirmationModal(
			`Opravdu chcete smazat kontakt ${contact.relationship}?`,
		);
		if (!confirmation) return;

		await this.api.MembersApi.deleteContact(member.id, contact.id);

		this.contacts.set((this.contacts() ?? []).filter((c) => c.id !== contact.id));

		await this.toastService.toast("Kontakt byl smazán", { color: "danger" });
	}
}
