import { Component, computed, OnInit, signal } from "@angular/core";
import { IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { informationCircleOutline, statsChartOutline } from "ionicons/icons";
import { MemberRoles } from "src/app/core/config/member-roles";
import { MembershipStates } from "src/app/core/config/membership-states";
import { ApiService } from "src/app/core/services/api.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { SDK } from "src/sdk";
import { GroupsService } from "../../services/groups.service";

interface StatRow {
	label: string;
	value: number;
}

@UntilDestroy()
@Component({
	selector: "bo-group-info",
	templateUrl: "./group-info.component.html",
	styleUrls: ["./group-info.component.scss"],
	imports: [
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		IonIcon,
		IonSkeletonText,
	],
})
export class GroupInfoComponent implements OnInit {
	group = signal<SDK.GroupResponseWithLinks | null | undefined>(undefined);

	// All members of the group (active and inactive) — the basis for the stats below.
	members = signal<SDK.MemberResponseWithLinks[] | undefined>(undefined);

	private groupId?: number;
	private latestLoadId = 0;

	// Active members only (inactive are counted separately as a status stat).
	private activeMembers = computed(() => this.members()?.filter((member) => member.active) ?? []);

	totalActive = computed(() => this.activeMembers().length);

	// Active members broken down by role, in the config's order.
	roleStats = computed<StatRow[]>(() => {
		const active = this.activeMembers();
		return Object.entries(MemberRoles).map(([role, meta]) => ({
			label: this.capitalize(meta.title),
			value: active.filter((member) => member.role === role).length,
		}));
	});

	// Active members broken down by membership state, in the config's order.
	membershipStats = computed<StatRow[]>(() => {
		const active = this.activeMembers();
		return Object.entries(MembershipStates).map(([state, meta]) => ({
			label: meta.title,
			value: active.filter((member) => member.membership === state).length,
		}));
	});

	inactiveCount = computed(() => this.members()?.filter((member) => !member.active).length ?? 0);

	constructor(
		private api: ApiService,
		private groupsService: GroupsService,
	) {
		addIcons({ informationCircleOutline, statsChartOutline });
	}

	ngOnInit(): void {
		this.groupsService.currentGroup.pipe(untilDestroyed(this)).subscribe((group) => {
			this.group.set(group);
			this.groupId = group?.id;
			this.loadMembers();
		});
	}

	private async loadMembers() {
		if (!this.groupId) {
			this.members.set(undefined);
			return;
		}

		this.members.set(undefined);

		// Guard against out-of-order responses when the group changes rapidly.
		const loadId = ++this.latestLoadId;

		const members = await this.api.MembersApi.listMembers({
			groups: [this.groupId],
			// active omitted: fetch active and inactive so both can be counted.
		}).then((res) => res.data);

		if (loadId !== this.latestLoadId) return;

		this.members.set(members);
	}

	private capitalize(value: string): string {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}
}
