import { CommonModule, KeyValuePipe } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import {
	IonButton,
	IonButtons,
	IonInput,
	IonItem,
	IonLabel,
	IonSelect,
	IonSelectOption,
	ViewWillEnter,
} from "@ionic/angular/standalone";
import { MemberRoles } from "src/app/core/config/member-roles";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { GroupsSelectComponent } from "src/app/shared/components/groups-select/groups-select.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageFooterComponent } from "src/app/shared/components/page-footer/page-footer.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";

@Component({
	selector: "members-create",
	templateUrl: "./members-create.component.html",
	styleUrls: ["./members-create.component.scss"],

	imports: [
		CommonModule,
		FormsModule,
		KeyValuePipe,
		PageHeaderComponent,
		PageContentComponent,
		PageFooterComponent,
		GroupsSelectComponent,
		IonItem,
		IonLabel,
		IonInput,
		IonSelect,
		IonSelectOption,
		IonButton,
		IonButtons,
	],
})
export class MembersCreateComponent implements ViewWillEnter {
	groups?: SDK.GroupResponseWithLinks[];
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
		this.groups = await this.api.MembersApi.listGroups().then((res) => res.data);
	}

	async onSubmit(form: NgForm) {
		const formData = form.value;

		const member = await this.api.MembersApi.createMember(formData).then((res) => res.data);
		this.toastService.toast("Člen uložen.");

		this.router.navigate(["../", {}, member.id], { relativeTo: this.route, replaceUrl: true });
	}
}
