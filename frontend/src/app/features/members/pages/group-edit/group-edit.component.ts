import { Component, OnInit, signal } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { IonButton, IonInput, IonItem, IonLabel, IonList, IonToggle, NavController } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
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
		private toastService: ToastService,
		private navController: NavController,
	) {}

	ngOnInit(): void {
		this.route.params.subscribe((params) => {
			if (params["id"]) this.loadGroup(parseInt(params["id"]));
		});
	}

	private async loadGroup(groupId: number) {
		this.group.set(await this.api.MembersApi.getGroup(groupId).then((res) => res.data));
	}

	async editGroup(form: NgForm) {
		const groupData = form.value;

		await this.api.MembersApi.updateGroup(this.group()!.id, groupData);

		this.toastService.toast("Uloženo.", { color: "success" });

		this.navController.back();
	}
}
