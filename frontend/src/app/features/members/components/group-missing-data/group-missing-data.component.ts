import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonButton, IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { alertCircleOutline, checkmarkCircleOutline, chevronForwardOutline } from "ionicons/icons";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";
import { SDK } from "src/sdk";

interface MissingDataCheck {
	// Shown as a pill next to the member, so it reads as the name of the missing item.
	label: string;
	missing: (member: SDK.MemberResponse) => boolean;
}

export interface MissingDataEntry {
	member: SDK.MemberResponseWithLinks;
	labels: string[];
}

// The checks a member is run through, in the order their pills appear. Contacts are only known when
// the list was loaded with `contacts: true` — see GroupInfoComponent.loadMembers().
const MISSING_DATA_CHECKS: MissingDataCheck[] = [
	{
		// A child is reached through their parents, so an empty contacts list means there is nobody to call.
		label: "Kontakt na rodiče",
		missing: (member) => member.role === "dite" && !member.contacts?.length,
	},
	{
		// Instructors and leaders are reached directly; a contact on the member record counts as well.
		label: "Kontakt",
		missing: (member) =>
			member.role !== "dite" &&
			!member.mobile &&
			!member.email &&
			!member.contacts?.some((contact) => contact.mobile || contact.email),
	},
	{
		label: "Datum narození",
		missing: (member) => !member.birthday,
	},
	{
		// Street and city are what an address is actually used for (mail, pickup), so either one
		// missing counts as an unusable address.
		label: "Adresa",
		missing: (member) => !member.addressStreet || !member.addressCity,
	},
	{
		label: "Kartička pojištěnce",
		missing: (member) => !member.insuranceCardFile,
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
	// All members of the group; undefined while they are still loading.
	members = input<SDK.MemberResponseWithLinks[] | undefined>(undefined);

	// Group color, so the card matches the other cards on the info tab.
	color = input<string | undefined>(undefined);

	// Only active members are checked — nobody is going to complete the record of someone who left.
	// Members without any missing data drop out of the list entirely.
	entries = computed<MissingDataEntry[]>(() => {
		const members = this.members();
		if (!members) return [];

		return members
			.filter((member) => member.active)
			.map((member) => ({
				member,
				labels: MISSING_DATA_CHECKS.filter((check) => check.missing(member)).map((check) => check.label),
			}))
			.filter((entry) => entry.labels.length > 0);
	});

	// Total number of missing items across the group, shown in the card header.
	missingCount = computed(() => this.entries().reduce((sum, entry) => sum + entry.labels.length, 0));

	constructor() {
		addIcons({ alertCircleOutline, checkmarkCircleOutline, chevronForwardOutline });
	}
}
