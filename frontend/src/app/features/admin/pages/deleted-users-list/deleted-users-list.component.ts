import { DatePipe } from "@angular/common";
import { Component, signal } from "@angular/core";
import { ViewWillEnter } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowUndoOutline, trashOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AdminTableCellDirective } from "src/app/shared/components/admin-table/admin-table-cell.directive";
import { AdminTableColumnComponent } from "src/app/shared/components/admin-table/admin-table-column.component";
import { AdminTableComponent } from "src/app/shared/components/admin-table/admin-table.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-deleted-users-list",
	templateUrl: "./deleted-users-list.component.html",
	styleUrls: ["./deleted-users-list.component.scss"],
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		AdminTableComponent,
		AdminTableColumnComponent,
		AdminTableCellDirective,
		DatePipe,
	],
})
export class DeletedUsersListComponent implements ViewWillEnter {
	users = signal<SDK.UserResponseWithLinks[] | undefined>(undefined);

	rowActionsHeader = (user: SDK.UserResponseWithLinks) => user.login;

	userActions = (user: SDK.UserResponseWithLinks): Action[] => [
		{
			text: "Obnovit",
			color: "success",
			icon: arrowUndoOutline,
			hidden: !user._links.restoreUser.allowed,
			handler: () => this.restoreUser(user),
		},
		{
			text: "Smazat trvale",
			role: "destructive",
			color: "danger",
			icon: trashOutline,
			hidden: !user._links.deleteUserPermanent.allowed,
			handler: () => this.permanentlyDeleteUser(user),
		},
	];

	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ arrowUndoOutline, trashOutline });
	}

	ionViewWillEnter(): void {
		this.loadUsers();
	}

	userName(user: SDK.UserResponse | null | undefined) {
		return user ? user.member?.nickname || user.login : "";
	}

	private async loadUsers() {
		const users = await this.api.UsersApi.listDeletedUsers().then((res) => res.data);
		this.users.set(users);
	}

	async restoreUser(user: SDK.UserResponseWithLinks) {
		if (!user._links.restoreUser.allowed) return;

		try {
			await this.api.UsersApi.restoreUser(user.id);
		} catch (err: any) {
			const message = err?.response?.data?.message ?? "Uživatele se nepodařilo obnovit.";
			await this.toastService.toast(message, { color: "danger", duration: 4000 });
			return;
		}

		await this.loadUsers();

		await this.toastService.toast(`Uživatel ${user.login} obnoven.`);
	}

	async permanentlyDeleteUser(user: SDK.UserResponseWithLinks) {
		if (!user._links.deleteUserPermanent.allowed) return;

		const confirmed = await this.modalService.deleteConfirmationModal("Tuto akci nelze vzít zpět.", {
			header: `Trvale smazat uživatele ${user.login}?`,
			buttonText: "Smazat trvale",
		});
		if (confirmed) await this.permanentlyDeleteUserConfirmed(user);
	}

	private async permanentlyDeleteUserConfirmed(user: SDK.UserResponseWithLinks) {
		try {
			await this.api.UsersApi.deleteUserPermanent(user.id);
		} catch (err: any) {
			const message = err?.response?.data?.message ?? "Uživatele se nepodařilo trvale smazat.";
			await this.toastService.toast(message, { color: "danger", duration: 4000 });
			return;
		}

		await this.loadUsers();

		await this.toastService.toast(`Uživatel ${user.login} trvale smazán.`);
	}
}
