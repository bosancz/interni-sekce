/// <reference types="google.accounts" />

import { Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { Logger } from "src/logger";
import { ApiService } from "./api.service";

const GSI_SRC = "https://accounts.google.com/gsi/client";

export class GoogleError extends Error {
	name: string = "GoogleError"; // when transpiled to ES5 cant test if instanceof GoogleError

	description?: string;

	constructor(message: string, description?: string) {
		super(message);
		this.description = description;
	}
}

@Injectable({
	providedIn: "root",
})
export class GoogleService {
	private readonly logger = new Logger(GoogleService.name);

	// Load the Google Identity Services client exactly once. Kicked off eagerly (see the
	// constructor) so the library is ready by the time the user clicks: requestCode() has
	// to run synchronously within the user gesture, otherwise the browser blocks the OAuth
	// popup and the sign-in fails silently.
	private gsiReady?: Promise<void>;

	constructor(private api: ApiService) {
		this.loadGsi().catch((err) => this.logger.error("Failed to preload Google Identity Services", err));
	}

	async signIn(): Promise<string> {
		await this.loadGsi();

		if (typeof google === "undefined" || !google.accounts?.oauth2) {
			throw new GoogleError("Google Identity Services library is not available");
		}

		const client_id = await firstValueFrom(this.api.info).then((info) => info.googleClientId);
		if (!client_id) throw new GoogleError("Google client ID was not provided by the API");

		const response = await new Promise<google.accounts.oauth2.CodeResponse>((resolve, reject) => {
			const client = google.accounts.oauth2.initCodeClient({
				client_id,
				scope: "openid email profile",
				ux_mode: "popup",
				callback: (res) => resolve(res),
				// Popup blocked, user cancelled, denied consent, unregistered origin, ... all
				// arrive here (never in `callback`); without this handler they were dropped and
				// the promise hung forever.
				error_callback: (err) =>
					reject(new GoogleError(err?.message || "Google sign-in was cancelled or failed", err?.type)),
			});

			client.requestCode();
		});

		if (response.error || !response.code) {
			throw new GoogleError(
				response.error_description || response.error || "No authorization code returned from Google",
			);
		}

		return response.code;
	}

	private loadGsi(): Promise<void> {
		if (this.gsiReady) return this.gsiReady;

		this.gsiReady = new Promise<void>((resolve, reject) => {
			const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
			if (existing) {
				if (typeof google !== "undefined" && google.accounts?.oauth2) return resolve();
				existing.addEventListener("load", () => resolve());
				existing.addEventListener("error", () => reject(new GoogleError("Failed to load Google Identity Services")));
				return;
			}

			const script = document.createElement("script");
			script.src = GSI_SRC;
			script.async = true;
			script.defer = true;
			script.onload = () => resolve();
			script.onerror = () => reject(new GoogleError("Failed to load Google Identity Services"));
			document.body.appendChild(script);
		});

		// Allow a later retry if this attempt failed to load the library.
		this.gsiReady.catch(() => (this.gsiReady = undefined));

		return this.gsiReady;
	}
}
