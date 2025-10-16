import { Component } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ViewWillEnter } from "@ionic/angular";
import { MemberRoles } from "src/app/config/member-roles";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { BackendApiTypes } from "src/sdk/backend.client";

@Component({
	selector: "members-create",
	templateUrl: "./members-create.component.html",
	styleUrls: ["./members-create.component.scss"],
	standalone: false,
})
export class MembersCreateComponent implements ViewWillEnter {
	groups?: BackendApiTypes.GroupResponseWithLinks[];
	roles = MemberRoles;

	constructor(
		private api: ApiService,
		private toastService: ToastService,
		private router: Router,
		private route: ActivatedRoute,
	) {}

	ionViewWillEnter() {
		this.loadGroups();
	}

	private async loadGroups() {
		this.groups = await this.api.get("/api/groups", { query: {} }).then((res) => res.data);
	}

	async onSubmit(form: NgForm) {
		const formData = form.value;

		const member = await this.api.post("/api/members", formData).then((res) => res.data);
		this.toastService.toast("Člen vytvořen.");

		this.router.navigate(["../", {}, member.id], { relativeTo: this.route, replaceUrl: true });
	}
}
