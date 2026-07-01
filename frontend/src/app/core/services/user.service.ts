import { computed, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { BehaviorSubject } from "rxjs";

import { ApiService } from "src/app/core/services/api.service";

import axios from "axios";
import { SDK } from "src/sdk";
import { ToastService } from "./toast.service";
/**
 * Service to save user information and commnicate user data with server
 */
@Injectable({
	providedIn: "root",
})
export class UserService {
	user = new BehaviorSubject<SDK.AccountResponseWithLinks | null | undefined>(undefined);

	/** Signal mirror of the current user, for reactive role checks. */
	readonly currentUser = toSignal(this.user);

	/** May manage the program (program managers, reviewers and admins). */
	readonly canManagePrograms = computed(() => this.hasRole("program", "revizor", "admin"));

	/** May manage users (reviewers and admins). */
	readonly canManageUsers = computed(() => this.hasRole("revizor", "admin"));

	/** Whether the administration section should be visible at all. */
	readonly canAccessAdmin = computed(() => this.canManagePrograms() || this.canManageUsers());

	/** True if the current user has at least one of the given roles. */
	hasRole(...roles: SDK.UserRolesEnum[]): boolean {
		const userRoles = this.currentUser()?.roles ?? [];
		return roles.some((role) => userRoles.includes(role));
	}

	constructor(
		private api: ApiService,
		private toastService: ToastService,
	) {
		this.loadUser();
	}

	clearUser() {
		this.user.next(null);
	}

	async loadUser() {
		try {
			const user = await this.api.AccountApi.getMe().then((res) => res.data);
			this.user.next(user);
			return user;
		} catch (err) {
			if (axios.isAxiosError(err) && [404, 401, 403].includes(err.response?.status!)) {
				this.user.next(null);
			} else if (axios.isAxiosError(err) && err.code === "ERR_NETWORK") {
				this.toastService.toast(`Nepodařilo se spojit se serverem.`, {
					color: "danger",
					duration: 0,
					buttons: [
						{
							text: "Zkusit znovu",
							handler: () => {
								this.loadUser();
							},
						},
					],
				});
				throw err;
			} else if (axios.isAxiosError(err)) {
				this.toastService.toast(`Nepodařilo se načíst uživatele: ${err.response?.data.message}`, {
					color: "danger",
					duration: 0,
					buttons: [
						{
							text: "Zkusit znovu",
							handler: () => {
								this.loadUser();
							},
						},
					],
				});
				throw err;
			} else {
				this.toastService.toast(`Nepodařilo se načíst uživatele. Jste připojeni k internetu?`, {
					color: "danger",
					duration: 0,
					buttons: [
						{
							text: "Zkusit znovu",
							handler: () => {
								this.loadUser();
							},
						},
					],
				});
				throw err;
			}
		}
	}
}
