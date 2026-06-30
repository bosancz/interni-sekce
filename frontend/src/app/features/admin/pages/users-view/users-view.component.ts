import { DatePipe } from "@angular/common";
import { Component, computed, signal } from "@angular/core";
import { ActivatedRoute, Params, Router, RouterLink } from "@angular/router";
import { IonButton, IonButtons, IonIcon } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { arrowForward, closeOutline, personCircleOutline, trashOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { LoginService } from "src/app/core/services/login.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { UserService } from "src/app/core/services/user.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { EditButtonComponent } from "src/app/shared/components/edit-button/edit-button.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";
import { MemberSelectorModalComponent } from "../../../events/components/member-selector-modal/member-selector-modal.component";
import { UserInfoComponent } from "../../components/user-info/user-info.component";

@UntilDestroy()
@Component({
	selector: "bo-users-view",
	templateUrl: "./users-view.component.html",
	styleUrl: "./users-view.component.scss",

	imports: [
		DatePipe,
		RouterLink,
		IonButton,
		IonButtons,
		IonIcon,
		PageHeaderComponent,
		PageContentComponent,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		EditButtonComponent,
		UserInfoComponent,
	],
})
export class UsersViewComponent {
	user = signal<SDK.UserResponseWithLinks | undefined>(undefined);

	title = computed(() => {
		const user = this.user();
		if (!user) return "...";
		return [user.login, user.email].filter(Boolean).join(", ");
	});

	actions = signal<Action[]>([]);

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
		private loginService: LoginService,
		private userService: UserService,
	) {
		addIcons({ arrowForward, closeOutline, personCircleOutline, trashOutline });
	}

	ngOnInit() {
		this.route.params
			.pipe(untilDestroyed(this))
			.subscribe((params: Params) => this.loadUser(parseInt(params["user"])));
	}

	async updateUser(data: SDK.UserUpdateBody) {
		const user = this.user();
		if (!user) return;

		const toast = await this.toastService.toast("Ukládám...");

		this.user.set({ ...user, ...data, member: data.memberId === null ? null : user.member });

		try {
			await this.api.UsersApi.updateUser(user.id, data);

			toast.dismiss();
			this.toastService.toast("Uloženo.");
		} catch (e) {
			toast.dismiss();
			this.toastService.toast("Chyba při ukládání.", { color: "danger" });
		}

		await this.loadUser(user.id);
	}

	async setPassword(password: string) {
		const user = this.user();
		if (!user || !password) return;

		const toast = await this.toastService.toast("Ukládám...");

		try {
			await this.api.UsersApi.setUserPassword(user.id, { password });

			toast.dismiss();
			this.toastService.toast("Heslo změněno.");
		} catch (e) {
			toast.dismiss();
			this.toastService.toast("Chyba při ukládání.", { color: "danger" });
		}
	}

	async changeMember() {
		const user = this.user();
		if (!user?._links.updateUser.allowed) return;

		// no componentProps: the modal loads the member list itself
		const member = await this.modalService.componentModal(MemberSelectorModalComponent);
		if (member) await this.updateUser({ memberId: member.id });
	}

	async unlinkMember() {
		const user = this.user();
		if (!user?._links.updateUser.allowed || !user.member) return;

		const confirmation = await this.modalService.deleteConfirmationModal(
			`Opravdu chcete odpojit člena ${user.member.nickname || user.member.firstName} od tohoto účtu?`,
			{ header: "Odpojit člena?", buttonText: "Odpojit" },
		);

		if (confirmation) await this.updateUser({ memberId: null });
	}

	private async loadUser(id: number) {
		const user = await this.api.UsersApi.getUser(id, { includeMember: true }).then((res) => res.data);
		this.user.set(user);
		this.setActions(user);
	}

	private async impersonateUser(user: SDK.UserResponseWithLinks) {
		const result = await this.loginService.loginImpersonate(user.id);

		if (result.success) {
			this.toastService.toast(`Přihlášen jako ${user.login}.`);
			this.router.navigate(["/"]);
		} else {
			this.toastService.toast("Přihlášení se nezdařilo.", { color: "danger" });
		}
	}

	private async deleteUser(user: SDK.UserResponseWithLinks) {
		const confirmation = await this.modalService.deleteConfirmationModal(
			`Opravdu chcete smazat uživatele ${user.login}?`,
		);

		if (!confirmation) return;

		await this.api.UsersApi.deleteUser(user.id);
		this.toastService.toast("Uživatel smazán.");
		this.router.navigate(["/admin/uzivatele"], { replaceUrl: true });
	}

	private setActions(user: SDK.UserResponseWithLinks) {
		const isCurrentUser = user.id === this.userService.user.value?.id;

		this.actions.set([
			{
				text: "Přihlásit se jako",
				icon: "person-circle-outline",
				hidden: !user._links.impersonateUser.applicable,
				disabled: !user._links.impersonateUser.allowed || isCurrentUser,
				handler: () => this.impersonateUser(user),
			},
			{
				text: "Smazat",
				icon: "trash-outline",
				color: "danger",
				hidden: !user._links.deleteUser.applicable,
				disabled: !user._links.deleteUser.allowed || isCurrentUser,
				handler: () => this.deleteUser(user),
			},
		]);
	}
}
