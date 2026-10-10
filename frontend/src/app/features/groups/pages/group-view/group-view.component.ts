import { Component, computed, OnInit, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AlertController, NavController } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import {
	addOutline,
	alertCircleOutline,
	create,
	downloadOutline,
	peopleOutline,
	statsChartOutline,
	trash,
} from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageFooterComponent } from "src/app/shared/components/page-footer/page-footer.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { TabComponent } from "src/app/shared/components/tab/tab.component";
import { TabsComponent } from "src/app/shared/components/tabs/tabs.component";
import { VerticalMenuItemComponent } from "src/app/shared/components/vertical-menu-item/vertical-menu-item.component";
import { VerticalMenuComponent } from "src/app/shared/components/vertical-menu/vertical-menu.component";
import { SDK } from "src/sdk";
import { GroupMembersComponent } from "../../components/group-members/group-members.component";
import {
	countMissingData,
	getMissingDataEntries,
	GroupMissingDataComponent,
} from "../../components/group-missing-data/group-missing-data.component";
import { GroupStatisticsComponent } from "../../components/group-statistics/group-statistics.component";
import {
	getUnpaidMembers,
	GroupUnpaidMembershipComponent,
} from "../../components/group-unpaid-membership/group-unpaid-membership.component";
import { MemberCreateModalComponent } from "src/app/features/members/components/member-create-modal/member-create-modal.component";
import { GroupsService } from "../../services/groups.service";

@UntilDestroy()
@Component({
	selector: "bo-group-view",
	templateUrl: "./group-view.component.html",
	styleUrls: ["./group-view.component.scss"],
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		PageFooterComponent,
		TabsComponent,
		TabComponent,
		VerticalMenuComponent,
		VerticalMenuItemComponent,
		GroupMembersComponent,
		GroupMissingDataComponent,
		GroupStatisticsComponent,
		GroupUnpaidMembershipComponent,
	],
})
export class GroupViewComponent implements OnInit {
	group = signal<SDK.GroupResponseWithLinks | null | undefined>(undefined);

	members = signal<SDK.MemberResponseWithLinks[] | undefined>(undefined);

	view = signal<"clenove" | "statistiky" | "kontrola">("clenove");

	problemsCount = computed(() => {
		const members = this.members();
		if (!members) return undefined;

		const count = countMissingData(getMissingDataEntries(members)) + getUnpaidMembers(members).length;
		return count || undefined;
	});

	private latestLoadId = 0;

	actions = computed<Action[]>(() => {
		const links = this.group()?._links;

		const actions: Action[] = [
			{
				text: "Upravit",
				icon: "create",
				pinned: true,
				hidden: !links?.updateGroup.applicable || !links?.updateGroup.allowed,
				handler: () => this.navController.navigateForward(["/oddily", this.group()?.shortName, "upravit"]),
			},
			{
				text: "Smazat",
				icon: "trash",
				color: "danger",
				hidden: !links?.deleteGroup.applicable || !links?.deleteGroup.allowed,
				handler: () => this.deleteGroup(),
			},
		];

		if (this.view() === "clenove") {
			actions.push(
				{
					text: "Nový člen",
					icon: "add-outline",
					pinned: true,

					handler: () => this.createMember(),
				},
				{
					text: "Export do XLSX",
					icon: "download-outline",
					handler: () => this.exportMembers(),
				},
			);
		}

		return actions;
	});

	constructor(
		private route: ActivatedRoute,
		private api: ApiService,
		private navController: NavController,
		private groupsService: GroupsService,
		private alertController: AlertController,
		private toastService: ToastService,
		private modalService: ModalService,
	) {
		addIcons({ peopleOutline, statsChartOutline, alertCircleOutline, create, trash, addOutline, downloadOutline });
	}

	ngOnInit(): void {
		this.route.params.subscribe((params) => {
			if (params["group"]) this.groupsService.loadGroup(params["group"]);
		});

		this.groupsService.currentGroup.pipe(untilDestroyed(this)).subscribe((group) => {
			this.group.set(group);
			this.loadMembers(group?.id);
		});
	}

	private async loadMembers(groupId?: number) {
		this.members.set(undefined);
		if (!groupId) return;

		const loadId = ++this.latestLoadId;

		const members = await this.api.MembersApi.listMembers({
			groups: [groupId],
			limit: 1000,
			contacts: true,
		}).then((res) => res.data);

		if (loadId !== this.latestLoadId) return;

		this.members.set(members);
	}

	private async deleteGroup() {
		const group = this.group();
		if (!group) return;

		const alert = await this.alertController.create({
			header: `Smazat ${group.name ?? group.id}?`,
			buttons: [
				{
					text: "Zrušit",
					role: "cancel",
				},
				{
					text: "Smazat",
					role: "destructive",
					handler: async () => this.deleteGroupConfirmed(group),
				},
			],
		});

		await alert.present();
	}

	private async deleteGroupConfirmed(group: SDK.GroupResponseWithLinks) {
		await this.api.MembersApi.deleteGroup(group.id);

		await this.toastService.toast(`${group.name ?? "Oddíl " + group.id} smazán.`);

		this.navController.navigateBack("/databaze");
	}

	private async createMember() {
		const group = this.group();
		if (!group) return;

		const memberData = await this.modalService.componentModal(MemberCreateModalComponent, {
			defaultGroupId: group.id,
		});
		if (!memberData) return;

		await this.api.MembersApi.createMember(memberData);
		await this.toastService.toast("Člen uložen.");

		this.groupsService.loadGroup(group.shortName);
	}

	private async exportMembers() {
		const group = this.group();
		if (!group) return;

		const res = await this.api.MembersApi.exportMembersXlsx(
			{ groups: [group.id], active: true },
			{ responseType: "blob" },
		);

		const blob = new Blob([res.data], {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		});

		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${group.shortName ?? "oddil-" + group.id}.xlsx`;
		a.click();
		URL.revokeObjectURL(url);
	}
}
