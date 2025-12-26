import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { NavController } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ApiService } from "src/app/services/api.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { SDK } from "src/sdk";
import { GroupsService } from "../../services/groups.service";

@UntilDestroy()
@Component({
	selector: "bo-group-view",
	templateUrl: "./group-view.component.html",
	styleUrls: ["./group-view.component.scss"],
	standalone: false,
})
export class GroupViewComponent implements OnInit {
	group?: SDK.GroupResponseWithLinks | null;

	actions: Action[] = [
		{
			text: "Upravit",
			icon: "create",
			pinned: true,
			handler: () => this.navController.navigateForward(`/oddily/${this.group?.id}/upravit`),
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
	) {}

	ngOnInit(): void {
		this.route.params.subscribe((params) => {
			if (params["id"]) this.groupsService.loadGroup(parseInt(params["id"]));
		});

		this.groupsService.currentGroup.pipe(untilDestroyed(this)).subscribe((group) => (this.group = group));
	}

	private async deleteGroup() {}
}
