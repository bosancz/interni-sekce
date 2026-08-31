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

	// Permission gates are derived from the API root `_links` rather than the user's roles, so the
	// backend stays the single source of truth: a link's `allowed` flag already encodes who may use
	// it. This keeps navigation visibility (and the route guards) in lock-step with what the server
	// actually permits, instead of duplicating the role rules on the client.

	/**
	 * May open the program section (whoever the backend lets list events, i.e. leaders). The page is
	 * an overview of the event pipeline; the program-role actions on each event stay gated per-event
	 * by that event's own `_links`, so non-managers simply see no action buttons.
	 */
	readonly canAccessProgram = computed(() => this.api.links()?.listEvents.allowed ?? false);

	/**
	 * May open the users section (whoever the backend lets list users). Listing is the entry point;
	 * the actual create/edit/delete actions stay gated per-user by that user's own `_links`, so
	 * non-managers only get a read-only view.
	 */
	readonly canAccessUsers = computed(() => this.api.links()?.listUsers.allowed ?? false);

	/**
	 * May open the treasurer view (whoever the backend lets list members). Recording a fee is
	 * admin-only and stays gated per member by that member's own `_links`, so everyone else gets a
	 * read-only overview of who has paid.
	 */
	readonly canAccessTreasurer = computed(() => this.api.links()?.listMembers.allowed ?? false);

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
