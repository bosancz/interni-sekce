import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AlertController, ViewWillEnter, ViewWillLeave } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { addOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "bo-groups-list",
	templateUrl: "./groups-list.component.html",
	styleUrls: ["./groups-list.component.scss"],

	imports: [PageHeaderComponent, PageContentComponent, RouterLink],
})
export class GroupsListComponent implements ViewWillEnter, ViewWillLeave {
	groups = signal<SDK.GroupResponseWithLinks[]>([]);

	totalMemberCount = signal<number>(0);

	actions = signal<Action[]>([]);

	createGroupLink = signal<SDK.AcLink | null>(null);

	alert?: HTMLIonAlertElement;

	constructor(
		private api: ApiService,
		private alertController: AlertController,
		private toastService: ToastService,
	) {
		addIcons({ addOutline });
	}

	ionViewWillEnter(): void {
		this.loadGroups();

		this.api.rootLinks.pipe(untilDestroyed(this, "ionViewWillLeave")).subscribe((links) => this.setActions(links));
	}

	ionViewWillLeave(): void {
		this.alert?.dismiss();
	}

	private setActions(links: SDK.RootResponseLinks | null) {
		this.createGroupLink.set(links?.createGroup ?? null);

		this.actions.set([
			{
				text: "Nový oddíl",
				icon: "add-outline",
				pinned: true,
				disabled: !links?.createGroup.allowed,
				hidden: !links?.createGroup.applicable,
				handler: () => this.createGroup(),
			},
		]);
	}

	async createGroup() {
		this.alert = await this.alertController.create({
			header: "Vytvořit oddíl",
			inputs: [
				{ name: "name", type: "text", placeholder: "Název" },
				{ name: "shortName", type: "text", placeholder: "Zkratka" },
			],
			buttons: [
				{ role: "cancel", text: "Zrušit" },
				{
					text: "Vytvořit",
					handler: (data: SDK.CreateGroupBody) => this.onCreateGroup(data),
				},
			],
		});

		await this.alert.present();
	}

	private onCreateGroup(groupData: SDK.CreateGroupBody) {
		if (!groupData.name || !groupData.shortName) {
			this.toastService.toast("Musíš vyplnit název i zkratku");
			return false;
		}

		this.createGroupConfirmed(groupData);
	}

	private async createGroupConfirmed(groupData: SDK.CreateGroupBody) {
		const group = await this.api.MembersApi.createGroup(groupData).then((res) => res.data);

		await this.loadGroups();

		await this.toastService.toast(`${group.name ?? "Oddíl " + group.id} vytvořen.`);
	}

	private async loadGroups() {
		const groups = await this.api.MembersApi.listGroups({ includeMemberCounts: true, active: true }).then(
			(res) => res.data,
		);
		groups.sort((a, b) =>
			(a.name ?? a.shortName).localeCompare(b.name ?? b.shortName, undefined, { numeric: true }),
		);

		this.groups.set(groups);

		this.totalMemberCount.set(groups.reduce((sum, group) => sum + (group.memberCount ?? 0), 0));
	}

	async deleteGroup(group: SDK.GroupResponseWithLinks) {
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

		alert.present();
	}

	private async deleteGroupConfirmed(group: SDK.GroupResponseWithLinks) {
		await this.api.MembersApi.deleteGroup(group.id);

		await this.loadGroups();

		await this.toastService.toast(`${group.name ?? "Oddíl " + group.id} smazán.`);
	}
}
