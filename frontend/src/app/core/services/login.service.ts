import { EventEmitter, Injectable } from "@angular/core";

import { ApiService } from "src/app/core/services/api.service";
import { GoogleService } from "src/app/core/services/google.service";
import { Logger } from "src/logger";
import { ToastService } from "./toast.service";
import { UserService } from "./user.service";

export type LoginErrorCode =
	| "invalidCredentials"
	| "userNotFound"
	| "googleFailed"
	| "unknownError"
	| "credentialsLoginNotAvalible";

export class LoginError extends Error {
	constructor(
		public code: LoginErrorCode,
		err: unknown,
	) {
		const message =
			err && typeof err === "object" && "message" in err && typeof err.message === "string"
				? err.message
				: undefined;
		super(message);
	}
}

@Injectable({
	providedIn: "root",
})
export class LoginService {
	private readonly logger = new Logger(LoginService.name);

	onLogin: EventEmitter<void> = new EventEmitter();
	onLogout: EventEmitter<void> = new EventEmitter();

	constructor(
		private api: ApiService,
		private googleService: GoogleService,
		private userService: UserService,
		private toastService: ToastService,
	) {}

	async loginCredentials(credentials: { login: string; password: string }) {
		try {
			await this.api.AccountApi.loginUsingCredentials(credentials);

			await this.userService.loadUser();
		} catch (err: any) {
			if (this.api.isApiError(err)) {
				switch (err.response?.status) {
					case 401:
					case 403:
						throw new LoginError("invalidCredentials", err);
						break;
					case 404:
						throw new LoginError("userNotFound", err);
						break;
					case 409:
					case 503:
						throw new LoginError("credentialsLoginNotAvalible", err);
						break;
					default:
						throw err;
				}
			} else {
				throw new LoginError("unknownError", err);
			}
		}
	}

	async loginGoogle() {
		try {
			const googleToken = await this.googleService.signIn();

			await this.api.AccountApi.loginUsingGoogle({ token: googleToken });

			await this.userService.loadUser();
		} catch (err) {
			this.logger.error("Google login failed", err);
			throw new LoginError("googleFailed", err);
		}
	}

	async loginImpersonate(userId: number) {
		try {
			await this.api.UsersApi.impersonateUser(userId);

			await this.userService.loadUser();

			return { success: true };
		} catch (err: any) {
			return { success: false, error: err.message };
		}
	}

	async sendLoginLink(login: string) {
		return this.api.AccountApi.sendLoginLink({ login });
	}

	async logout() {
		await this.api.AccountApi.logout();
		const user = await this.userService.loadUser();

		if (user) this.toastService.toast("Přihlášen zpět jako " + user.login);
	}
}
