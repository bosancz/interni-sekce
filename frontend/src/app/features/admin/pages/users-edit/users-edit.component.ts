import { KeyValuePipe } from "@angular/common";
import { Component, OnInit, signal, ViewChild } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { IonBackButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonTitle, IonToolbar } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { UserRoles } from "src/app/core/config/user-roles";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action, ActionButtonsComponent } from "src/app/shared/components/action-buttons/action-buttons.component";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "bo-users-edit",
	templateUrl: "./users-edit.component.html",
	styleUrls: ["./users-edit.component.scss"],
	
	imports: [
		FormsModule,
		KeyValuePipe,
		IonHeader,
		IonToolbar,
		IonButtons,
		IonBackButton,
		IonTitle,
		IonContent,
		IonItem,
		IonLabel,
		IonInput,
		IonSelect,
		IonSelectOption,
		ActionButtonsComponent,
		GroupPipe,
	],
})
export class UsersEditComponent implements OnInit {
	user = signal<SDK.UserResponseWithLinks | undefined>(undefined);

	roles = UserRoles;

	members = signal<SDK.MemberResponse[]>([]);

	category = signal("ucet");

	actions = signal<Action[]>([
		{
			text: "Uložit",
			handler: () => this.saveUser(),
		},
	]);

	@ViewChild("editUserForm") form!: NgForm;

	constructor(
		private api: ApiService,
		private toastService: ToastService,
		private route: ActivatedRoute,
		private router: Router,
	) {}

	ngOnInit() {
		this.route.params.pipe(untilDestroyed(this)).subscribe((params: Params) => {
			const user = this.user();
			if (params.user && (!user || user.id !== params.user)) this.loadUser(params.user);

			this.category.set(params.cat);
		});

		this.loadMembers();
	}

	// DB interaction
	async loadUser(userId: number) {
		const user = await this.api.UsersApi.getUser(userId, {}).then((res: any) => res.data);
		this.user.set(user);
	}

	async loadMembers() {
		let members = await this.api.MembersApi.listMembers().then((res: any) => res.data);
		members.sort((a: any, b: any) => (a.nickname || "").localeCompare(b.nickname || ""));
		this.members.set(members);
	}

	async saveUser() {
		const user = this.user();
		if (!user) return;

		const userData = this.form.value;

		await this.api.UsersApi.updateUser(user.id, userData);

		this.toastService.toast("Uloženo.");

		this.router.navigate(["../"], { relativeTo: this.route, replaceUrl: true });
	}
}
