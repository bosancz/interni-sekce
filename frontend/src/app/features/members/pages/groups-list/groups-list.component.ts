import { Component, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { ActionSheetController, AlertController, NavController, ViewWillEnter } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-groups-list",
	templateUrl: "./groups-list.component.html",
	styleUrls: ["./groups-list.component.scss"],

	imports: [
		PageHeaderComponent,
		PageContentComponent,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		RouterLink,
	],
})
export class GroupsListComponent implements ViewWillEnter {
	groups = signal<SDK.GroupResponseWithLinks[]>([]);

	totalMemberCount = signal<number>(0);

	actions: Action[] = [
		{
			text: "Nový oddíl",
			icon: "add-outline",
			pinned: true,
			handler: () => this.navController.navigateForward(["vytvorit"], { relativeTo: this.route }),
		},
	];

	constructor(
		private api: ApiService,
		private navController: NavController,
		private route: ActivatedRoute,
		private actionSheetController: ActionSheetController,
		private alertController: AlertController,
		private toastService: ToastService,
	) {}

	ionViewWillEnter(): void {
		this.loadGroups();
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
