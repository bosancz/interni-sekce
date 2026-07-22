import { Component, input, output } from "@angular/core";
import { IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { homeOutline } from "ionicons/icons";
import { ModalService } from "src/app/core/services/modal.service";
import { SDK } from "src/sdk";
import { CardContentComponent } from "../../../../shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "../../../../shared/components/card-header/card-header.component";
import { CardTitleComponent } from "../../../../shared/components/card-title/card-title.component";
import { CardComponent } from "../../../../shared/components/card/card.component";
import { CopyButtonComponent } from "../../../../shared/components/copy-button/copy-button.component";
import { EditButtonComponent } from "../../../../shared/components/edit-button/edit-button.component";

@Component({
	selector: "bo-member-address",
	imports: [
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		IonIcon,
		IonSkeletonText,
		CopyButtonComponent,
		EditButtonComponent,
	],
	templateUrl: "./member-address.component.html",
	styleUrl: "./member-address.component.scss",
})
export class MemberAddressComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
	update = output<Partial<SDK.MemberResponse>>();

	constructor(private modalService: ModalService) {
		addIcons({ homeOutline });
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
}
