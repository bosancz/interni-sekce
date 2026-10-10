import { computed, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { BehaviorSubject } from "rxjs";

import { ApiService } from "src/app/core/services/api.service";

import axios from "axios";
import { SDK } from "src/sdk";
import { ToastService } from "./toast.service";
export function hasUserRole(userRoles: SDK.UserRolesEnum[], roles: SDK.UserRolesEnum[]) {
	return userRoles.includes("admin") || roles.some((role) => userRoles.includes(role));
}

@Injectable({
	providedIn: "root",
})
export class UserService {
	user = new BehaviorSubject<SDK.AccountResponseWithLinks | null | undefined>(undefined);

	readonly currentUser = toSignal(this.user);

	readonly roles = computed(() => this.currentUser()?.roles ?? []);

	readonly isAdmin = computed(() => this.roles().includes("admin"));

	readonly canAccessProgram = computed(() => this.hasRole("program"));

	readonly canAccessTreasurer = computed(() => this.hasRole("pokladnik"));

	readonly canAccessAdmin = this.isAdmin;

	readonly myGroupId = computed(() => this.currentUser()?.member?.groupId ?? null);

	constructor(
		private api: ApiService,
		private toastService: ToastService,
	) {
		this.loadUser();
	}

	hasRole(...roles: SDK.UserRolesEnum[]) {
		return hasUserRole(this.roles(), roles);
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
