import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonButton, IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
	alertCircleOutline,
	calendarOutline,
	callOutline,
	checkmarkCircleOutline,
	chevronForwardOutline,
	homeOutline,
	mailOutline,
	medkitOutline,
	cardOutline,
} from "ionicons/icons";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";
import { getInsuranceCardExpirationState } from "src/helpers/insurance-card";
import { SDK } from "src/sdk";

interface MissingDataCheck {
	label: string;
	icon: string;
	missing: (member: SDK.MemberResponse) => boolean;
}

export interface MissingDataItem {
	label: string;
	icon: string;
}

export interface MissingDataEntry {
	member: SDK.MemberResponseWithLinks;
	items: MissingDataItem[];
}

const MISSING_DATA_CHECKS: MissingDataCheck[] = [
	{
		label: "Kontakt na rodiče",
		icon: "call-outline",
		missing: (member) => member.role === "dite" && !member.contacts?.length,
	},
	{
		label: "Telefon",
		icon: "call-outline",
		missing: (member) => member.role !== "dite" && !member.mobile,
	},
	{
		label: "E-mail",
		icon: "mail-outline",
		missing: (member) => member.role !== "dite" && !member.email,
	},
	{
		label: "Datum narození",
		icon: "calendar-outline",
		missing: (member) => !member.birthday,
	},
	{
		label: "Adresa",
		icon: "home-outline",
		missing: (member) => !member.addressStreet || !member.addressCity,
	},
	{
		label: "Kartička pojištěnce",
		icon: "card-outline",
		missing: (member) => member.role === "dite" && !member.insuranceCardFile,
	},
	{
		label: "Platnost kartičky",
		icon: "card-outline",
		missing: (member) =>
			!!member.insuranceCardFile && getInsuranceCardExpirationState(member.insuranceCardExpiration) !== "valid",
	},
];

@Component({
	selector: "bo-group-missing-data",
	templateUrl: "./group-missing-data.component.html",
	styleUrls: ["./group-missing-data.component.scss"],
	imports: [
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		IonIcon,
		IonButton,
		IonSkeletonText,
		RouterLink,
		MemberPipe,
	],
})
export class GroupMissingDataComponent {
	members = input<SDK.MemberResponseWithLinks[] | undefined>(undefined);

	color = input<string | undefined>(undefined);

	entries = computed<MissingDataEntry[]>(() => {
		const members = this.members();
		if (!members) return [];

		return members
			.filter((member) => member.active)
			.map((member) => ({
				member,
				items: MISSING_DATA_CHECKS.filter((check) => check.missing(member)).map(({ label, icon }) => ({
					label,
					icon,
				})),
			}))
			.filter((entry) => entry.items.length > 0);
	});

	missingCount = computed(() => this.entries().reduce((sum, entry) => sum + entry.items.length, 0));

	constructor() {
		addIcons({
			alertCircleOutline,
			checkmarkCircleOutline,
			chevronForwardOutline,
			callOutline,
			mailOutline,
			calendarOutline,
			homeOutline,
			cardOutline,
			medkitOutline,
		});
	}
}
