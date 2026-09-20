import { computed, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { BehaviorSubject } from "rxjs";

import { ApiService } from "src/app/core/services/api.service";

import axios from "axios";
import { SDK } from "src/sdk";
import { ToastService } from "./toast.service";
@Injectable({
	providedIn: "root",
})
export class UserService {
	user = new BehaviorSubject<SDK.AccountResponseWithLinks | null | undefined>(undefined);

	readonly currentUser = toSignal(this.user);

	readonly canAccessProgram = computed(() => this.api.links()?.listEvents.allowed ?? false);

	readonly canAccessUsers = computed(() => this.api.links()?.listUsers.allowed ?? false);

	/**
	 * May open the treasurer view. The page shows the club's bank account and records the membership
	 * fees, so it is for the treasurer — `updatePaymentSettings` is the root link the backend grants
	 * to `pokladnik` and admins, and the page's route guard is gated on the same one.
	 */
	readonly canAccessTreasurer = computed(() => this.api.links()?.updatePaymentSettings.allowed ?? false);

	/** Whether the administration section should be visible at all. */
	readonly canAccessAdmin = computed(
		() => this.canAccessProgram() || this.canAccessUsers() || this.canAccessTreasurer(),
	);

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
