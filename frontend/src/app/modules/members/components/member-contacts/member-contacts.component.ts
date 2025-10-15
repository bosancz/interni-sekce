import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { AlertButton, AlertController } from "@ionic/angular";
import { UntilDestroy } from "@ngneat/until-destroy";
import { ModalService } from "src/app/services/modal.service";
import { ToastService } from "src/app/services/toast.service";

@UntilDestroy()
@Component({
	selector: "bo-member-contacts",
	templateUrl: "./member-contacts.component.html",
	styleUrls: ["./member-contacts.component.scss"],
	standalone: false,
})
export default class MemberContactsComponent implements OnChanges {
	@Input() member?: BackendApiTypes.MemberResponseWithLinks | null;
	@Output() update = new EventEmitter<Partial<BackendApiTypes.MemberResponse>>();

	contacts?: BackendApiTypes.MemberContactResponseWithLinks[];

	constructor(
		private toastService: ToastService,
		private api: BackendApi,
		private alertController: AlertController,
		private modalService: ModalService,
	) {}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes["member"]) this.loadContacts(this.member?.id ?? null);
	}

	async loadContacts(memberId: number | null) {
		if (!memberId) {
			this.contacts = [];
		} else {
			this.contacts = await this.api.MembersApi.listContacts(memberId).then((res) => res.data);
		}
	}

	async editAddress() {
		const data = await this.modalService.inputModal({
			header: "Upravit adresu",
			inputs: {
				addressStreet: {
					type: "text",
					placeholder: "Ulice",
					value: this.member?.addressStreet,
				},
				addressStreetNo: {
					type: "text",
					placeholder: "Číslo popisné",
					value: this.member?.addressStreetNo,
				},
				addressCity: {
					type: "text",
					placeholder: "Město",
					value: this.member?.addressCity,
				},
				addressPostalCode: {
					type: "text",
					placeholder: "PSČ",
					value: this.member?.addressPostalCode,
				},
				addressCountry: {
					type: "text",
					placeholder: "Země",
					value: this.member?.addressCountry,
				},
			},
		});

		if (data) this.update.emit(data);
	}

	getFullAddress(member: BackendApiTypes.MemberResponseWithLinks) {
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
		const data = await this.modalService.inputModal({
			header: "Upravit telefonní číslo",
			inputs: {
				mobile: { type: "tel", placeholder: "Telefonní číslo", value: this.member?.mobile },
			},
		});

		if (data !== null) this.update.emit(data);
	}

	async editEmail() {
		const data = await this.modalService.inputModal({
			header: "Upravit email",
			inputs: {
				email: { type: "email", placeholder: "Email", value: this.member?.email },
			},
		});

		if (data !== null) this.update.emit(data);
	}

	async openContactForm(contact: BackendApiTypes.MemberContactResponseWithLinks | null) {
		const buttons: AlertButton[] = [
			{
				text: contact ? "Uložit" : "Přidat",
				handler: async (data) => {
					if (!data.title) {
						this.toastService.toast("Chybí název kontaktu", { color: "danger" });
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

		if (contact) {
			buttons.unshift({
				text: "Smazat",
				role: "destructive",
				handler: () => {
					alert.dismiss();
					if (contact) this.deleteContact(contact);
				},
			});
		} else {
			buttons.unshift({
				text: "Zrušit",
				role: "cancel",
			});
		}

		const alert = await this.alertController.create({
			header: contact ? "Upravit kontakt" : "Přidat kontakt",
			inputs: [
				{
					name: "title",
					type: "text",
					attributes: {
						required: true,
					},
					placeholder: "Název kontaktu",
					value: contact?.title,
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
		data: { title: string; email?: string; mobile?: string; other?: string },
	) {
		if (!this.member) return;

		if (contactId) {
			await this.api.MembersApi.updateContact(this.member.id, contactId, data);
		} else {
			await this.api.MembersApi.createContact(this.member.id, data);
		}

		await this.loadContacts(this.member.id);

		await this.toastService.toast(contactId ? "Kontakt byl upraven" : "Kontakt byl přidán");
	}

	async deleteContact(contact: BackendApiTypes.MemberContactResponseWithLinks) {
		if (!this.member) return;

		const confirmation = await this.modalService.deleteConfirmationModal(
			`Opravdu chcete smazat kontakt ${contact.title}?`,
		);

		await this.api.MembersApi.deleteContact(this.member.id, contact.id);

		await this.loadContacts(this.member.id);

		await this.toastService.toast("Kontakt byl smazán", { color: "danger" });
	}
}
