import { Component, computed, input } from "@angular/core";
import { IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { statsChartOutline } from "ionicons/icons";
import { MemberRoles } from "src/app/core/config/member-roles";
import { MembershipPaymentStates } from "src/app/core/config/membership";
import { currentMembershipYear, membershipState } from "src/app/core/helpers/membership";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { SDK } from "src/sdk";

interface StatRow {
	label: string;
	value: number;
}

@Component({
	selector: "bo-group-statistics",
	templateUrl: "./group-statistics.component.html",
	imports: [CardComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent, IonIcon, IonSkeletonText],
})
export class GroupStatisticsComponent {
	members = input<SDK.MemberResponseWithLinks[] | undefined>(undefined);

	color = input<string | undefined>(undefined);

	private activeMembers = computed(() => this.members()?.filter((member) => member.active) ?? []);

	totalActive = computed(() => this.activeMembers().length);

	roleStats = computed<StatRow[]>(() => {
		const active = this.activeMembers();
		return Object.entries(MemberRoles).map(([role, meta]) => ({
			label: this.capitalize(meta.title),
			value: active.filter((member) => member.role === role).length,
		}));
	});

	membershipStats = computed<StatRow[]>(() => {
		const active = this.activeMembers();
		const year = currentMembershipYear();
		return Object.entries(MembershipPaymentStates).map(([state, meta]) => ({
			label: `${meta.title} (${year})`,
			value: active.filter((member) => membershipState(member.membership) === state).length,
		}));
	});

	inactiveCount = computed(() => this.members()?.filter((member) => !member.active).length ?? 0);

	constructor() {
		addIcons({ statsChartOutline });
	}

	private capitalize(value: string): string {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}
}
