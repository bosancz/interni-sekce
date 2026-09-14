import { DatePipe } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { personOutline } from "ionicons/icons";
import { ModalService } from "src/app/core/services/modal.service";
import { SDK } from "src/sdk";
import { CardContentComponent } from "../../../../shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "../../../../shared/components/card-header/card-header.component";
import { CardTitleComponent } from "../../../../shared/components/card-title/card-title.component";
import { CardComponent } from "../../../../shared/components/card/card.component";
import { EditButtonDateComponent } from "../../../../shared/components/edit-button-date/edit-button-date.component";
import { EditButtonNameComponent } from "../../../../shared/components/edit-button-name/edit-button-name.component";
import { EditButtonTextComponent } from "../../../../shared/components/edit-button-text/edit-button-text.component";
import { EditButtonComponent } from "../../../../shared/components/edit-button/edit-button.component";
import { MemberPipe } from "../../../../shared/pipes/member.pipe";

@UntilDestroy()
@Component({
	selector: "bo-member-info",
	templateUrl: "./member-info.component.html",
	styleUrls: ["./member-info.component.scss"],
	imports: [
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		IonIcon,
		IonSkeletonText,
		DatePipe,
		EditButtonComponent,
		EditButtonNameComponent,
		EditButtonTextComponent,
		EditButtonDateComponent,
		MemberPipe,
	],
})
export class MemberInfoComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
	update = output<Partial<SDK.MemberResponse>>();

	constructor(private modalService: ModalService) {
		addIcons({ personOutline });
	}

	getFullAddress(member: SDK.MemberResponseWithLinks) {
		const addressLines = [
			`${member.addressStreet ?? ""}${member.addressStreetNo ? ` ${member.addressStreetNo}` : ""}`,
			member.addressCity,
			member.addressPostalCode,
			member.addressCountry,
		];

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
