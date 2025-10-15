import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ModalService } from "src/app/services/modal.service";

@Component({
	selector: "bo-member-address",
	standalone: false,
	templateUrl: "./member-address.component.html",
	styleUrl: "./member-address.component.scss",
})
export class MemberAddressComponent {
	@Input() member?: BackendApiTypes.MemberResponseWithLinks | null;
	@Output() update = new EventEmitter<Partial<BackendApiTypes.MemberResponse>>();

	constructor(private modalService: ModalService) {}

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
}
