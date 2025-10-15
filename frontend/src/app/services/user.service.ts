import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

import axios from "axios";
import { ToastService } from "./toast.service";
/**
 * Service to save user information and commnicate user data with server
 */
@Injectable({
	providedIn: "root",
})
export class UserService {
	user = new BehaviorSubject<BackendApiTypes.UserResponseWithLinks | null | undefined>(undefined);

	constructor(
		private api: BackendApi,
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
