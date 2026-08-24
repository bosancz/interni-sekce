import { Injectable, computed, signal } from "@angular/core";
import { LocalStorageService } from "./local-storage.service";

export interface BeforeInstallPromptEvent extends Event {
	platforms: string[];
	userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
	prompt: () => Promise<void>;
}

const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

const DISMISSED_AT_KEY = "pwa-install-dismissed-at";

@Injectable({
	providedIn: "root",
})
export class PwaInstallService {
	private readonly beforeinstallprompt = signal<BeforeInstallPromptEvent | undefined>(undefined);

	readonly installed = signal(false);

	readonly canInstall = computed(() => !this.installed() && !!this.beforeinstallprompt());

	constructor(private readonly localStorage: LocalStorageService) {
		window.addEventListener("beforeinstallprompt", (event) => {
			event.preventDefault();
			this.beforeinstallprompt.set(event as BeforeInstallPromptEvent);
		});

		window.addEventListener("appinstalled", () => {
			this.installed.set(true);
			this.beforeinstallprompt.set(undefined);
		});
	}

	async install(): Promise<"accepted" | "dismissed" | undefined> {
		const event = this.beforeinstallprompt();
		if (!event) return undefined;

		await event.prompt();
		const { outcome } = await event.userChoice;

		this.beforeinstallprompt.set(undefined);

		return outcome;
	}

	shouldAutoPrompt(): boolean {
		if (!this.canInstall()) return false;

		const dismissedAt = this.localStorage.get<number>(DISMISSED_AT_KEY);
		if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return false;

		return true;
	}

	snoozeAutoPrompt() {
		this.localStorage.set(DISMISSED_AT_KEY, Date.now());
	}
}
