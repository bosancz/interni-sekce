/// <reference types="google.accounts" />

import { Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { Config } from "src/config";
import { Logger } from "src/logger";
import { ApiService } from "./api.service";

const GSI_SRC = "https://accounts.google.com/gsi/client";

export class GoogleError extends Error {
	name: string = "GoogleError";

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

	private gsiReady?: Promise<void>;

	constructor(
		private api: ApiService,
		private config: Config,
	) {
		this.loadGsi().catch((err) => this.logger.error("Failed to preload Google Identity Services", err));
	}

	async signIn(): Promise<string> {
		await this.loadGsi();

		if (typeof google === "undefined" || !google.accounts?.oauth2) {
			throw new GoogleError("Google Identity Services library is not available");
		}

		const info = await firstValueFrom(this.api.info);
		const client_id = info.googleClientId || this.config.googleClientId;
		if (!client_id) throw new GoogleError("No Google client ID configured");

		const response = await new Promise<google.accounts.oauth2.TokenResponse>((resolve, reject) => {
			const client = google.accounts.oauth2.initTokenClient({
				client_id,
				scope: "openid email profile",
				callback: (res) => resolve(res),
				error_callback: (err) =>
					reject(new GoogleError(err?.message || "Google sign-in was cancelled or failed", err?.type)),
			});

			client.requestAccessToken();
		});

		if (response.error || !response.access_token) {
			throw new GoogleError(
				response.error_description || response.error || "No access token returned from Google",
			);
		}

		return response.access_token;
	}

	private loadGsi(): Promise<void> {
		if (this.gsiReady) return this.gsiReady;

		this.gsiReady = new Promise<void>((resolve, reject) => {
			const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
			if (existing) {
				if (typeof google !== "undefined" && google.accounts?.oauth2) return resolve();
				existing.addEventListener("load", () => resolve());
				existing.addEventListener("error", () =>
					reject(new GoogleError("Failed to load Google Identity Services")),
				);
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

		this.gsiReady.catch(() => (this.gsiReady = undefined));

		return this.gsiReady;
	}
}
