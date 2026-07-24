import { Injectable, computed, signal } from "@angular/core";
import { LocalStorageService } from "./local-storage.service";

// from https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
export interface BeforeInstallPromptEvent extends Event {
	platforms: string[];
	userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
	prompt: () => Promise<void>;
}

/** How long to wait before nagging again after the user dismisses the auto banner. */
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

const DISMISSED_AT_KEY = "pwa-install-dismissed-at";

/**
 * Captures the browser's `beforeinstallprompt` event app-wide and drives PWA installation.
 *
 * The event only fires once (and early, before most components mount), so the listener is
 * registered here in a root service rather than in a single component. Both the account page
 * button and the automatic install banner read `canInstall` / drive `install()` from here.
 */
@Injectable({
	providedIn: "root",
})
export class PwaInstallService {
	private readonly beforeinstallprompt = signal<BeforeInstallPromptEvent | undefined>(undefined);

	readonly installed = signal(false);

	/** True when the browser has offered an installable prompt we can still fire. */
	readonly canInstall = computed(() => !this.installed() && !!this.beforeinstallprompt());

	constructor(private readonly localStorage: LocalStorageService) {
		window.addEventListener("beforeinstallprompt", (event) => {
			// Prevent the browser's mini-infobar so we can present the prompt on our terms.
			event.preventDefault();
			this.beforeinstallprompt.set(event as BeforeInstallPromptEvent);
		});

		window.addEventListener("appinstalled", () => {
			this.installed.set(true);
			this.beforeinstallprompt.set(undefined);
		});
	}

	/**
	 * Fire the native install prompt. Resolves with the user's choice, or `undefined` when no
	 * prompt is available (already installed / unsupported browser).
	 */
	async install(): Promise<"accepted" | "dismissed" | undefined> {
		const event = this.beforeinstallprompt();
		if (!event) return undefined;

		await event.prompt();
		const { outcome } = await event.userChoice;

		// The event can only be used once.
		this.beforeinstallprompt.set(undefined);

		return outcome;
	}

	/** Whether the automatic banner should be offered (installable and not recently dismissed). */
	shouldAutoPrompt(): boolean {
		if (!this.canInstall()) return false;

		const dismissedAt = this.localStorage.get<number>(DISMISSED_AT_KEY);
		if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return false;

		return true;
	}

	/** Remember that the user dismissed the automatic banner, so we don't nag right away. */
	snoozeAutoPrompt() {
		this.localStorage.set(DISMISSED_AT_KEY, Date.now());
	}
}
