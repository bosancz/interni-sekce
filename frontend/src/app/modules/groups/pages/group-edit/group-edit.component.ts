import { Component, OnInit } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { NavController } from "@ionic/angular";
import { ToastService } from "src/app/services/toast.service";

@Component({
	selector: "bo-group-edit",
	templateUrl: "./group-edit.component.html",
	styleUrls: ["./group-edit.component.scss"],
	standalone: false,
})
export class GroupEditComponent implements OnInit {
	group?: BackendApiTypes.GroupResponseWithLinks;

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
		this.group = await this.api.MembersApi.getGroup(groupId).then((res) => res.data);
	}

	async editGroup(form: NgForm) {
		const groupData = form.value;

		await this.api.MembersApi.updateGroup(this.group!.id, groupData);

		this.toastService.toast("Uloženo.", { color: "success" });

		this.navController.back();
	}
}
