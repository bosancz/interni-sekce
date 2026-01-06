import { Component, EventEmitter, Input, Output } from "@angular/core";
import { IonButtons, IonItem, IonLabel, IonList, IonSkeletonText } from "@ionic/angular/standalone";
import { ModalService } from "src/app/services/modal.service";
import { SDK } from "src/sdk";
import { CardContentComponent } from "../../../../shared/components/card-content/card-content.component";
import { CardComponent } from "../../../../shared/components/card/card.component";
import { CopyButtonComponent } from "../../../../shared/components/copy-button/copy-button.component";
import { EditButtonComponent } from "../../../../shared/components/edit-button/edit-button.component";

@Component({
	selector: "bo-member-address",
	standalone: true,
	imports: [
		CardComponent,
		CardContentComponent,
		IonSkeletonText,
		IonList,
		IonItem,
		IonLabel,
		IonButtons,
		CopyButtonComponent,
		EditButtonComponent,
	],
	templateUrl: "./member-address.component.html",
	styleUrl: "./member-address.component.scss",
})
export class MemberAddressComponent {
	@Input() member?: SDK.MemberResponseWithLinks | null;
	@Output() update = new EventEmitter<Partial<SDK.MemberResponse>>();

	constructor(private modalService: ModalService) {}

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
