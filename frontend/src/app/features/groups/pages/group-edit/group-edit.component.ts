import { Component, OnInit, signal } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { IonButton, IonInput, IonItem, IonLabel, IonList, IonToggle, NavController } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { GroupsService } from "src/app/core/services/groups.service";
import { ToastService } from "src/app/core/services/toast.service";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageFooterComponent } from "src/app/shared/components/page-footer/page-footer.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-group-edit",
	templateUrl: "./group-edit.component.html",
	styleUrls: ["./group-edit.component.scss"],
	imports: [
		FormsModule,
		IonList,
		IonItem,
		IonLabel,
		IonInput,
		IonButton,
		IonToggle,
		PageHeaderComponent,
		PageContentComponent,
		PageFooterComponent,
	],
})
export class GroupEditComponent implements OnInit {
	group = signal<SDK.GroupResponseWithLinks | undefined>(undefined);

	constructor(
		private route: ActivatedRoute,
		private api: ApiService,
		private groupsService: GroupsService,
		private toastService: ToastService,
		private navController: NavController,
	) {}

	ngOnInit(): void {
		this.route.params.subscribe((params) => {
			if (params["group"]) this.loadGroup(params["group"]);
		});
	}

	private async loadGroup(shortName: string) {
		const listedGroup = await this.groupsService.getGroupByShortName(shortName);
		if (!listedGroup) return;

		this.group.set(await this.api.MembersApi.getGroup(listedGroup.id).then((res) => res.data));
	}

	async editGroup(form: NgForm) {
		const groupData = form.value;

		try {
			await this.api.MembersApi.updateGroup(this.group()!.id, groupData);
		} catch (err: any) {
			const message = err?.response?.data?.message ?? "Oddíl se nepodařilo uložit.";
			await this.toastService.toast(message, { color: "danger", duration: 4000 });
			return;
		}

		this.groupsService.reload();
		this.toastService.toast("Uloženo.", { color: "success" });

		this.navController.navigateBack(["/oddily", groupData.shortName ?? this.group()!.shortName]);
	}
}
