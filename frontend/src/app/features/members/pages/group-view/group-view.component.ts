import { Component, OnInit, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AlertController, NavController } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { create, informationCircleOutline, peopleOutline, trash } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
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
import { GroupInfoComponent } from "../../components/group-info/group-info.component";
import { GroupMembersComponent } from "../../components/group-members/group-members.component";
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
		GroupInfoComponent,
		GroupMembersComponent,
	],
})
export class GroupViewComponent implements OnInit {
	group = signal<SDK.GroupResponseWithLinks | null | undefined>(undefined);

	view = signal<"info" | "clenove">("clenove");

	actions: Action[] = [
		{
			text: "Upravit",
			icon: "create",
			pinned: true,
			handler: () => this.navController.navigateForward(`/databaze/oddily/${this.group()?.id}/upravit`),
		},
		{
			text: "Smazat",
			icon: "trash",
			color: "danger",

			handler: () => this.deleteGroup(),
		},
	];

	constructor(
		private route: ActivatedRoute,
		private api: ApiService,
		private navController: NavController,
		private groupsService: GroupsService,
		private alertController: AlertController,
		private toastService: ToastService,
	) {
		addIcons({ informationCircleOutline, peopleOutline, create, trash });
	}

	ngOnInit(): void {
		this.route.params.subscribe((params) => {
			if (params["id"]) this.groupsService.loadGroup(parseInt(params["id"]));
		});

		this.groupsService.currentGroup.pipe(untilDestroyed(this)).subscribe((group) => this.group.set(group));
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
}
