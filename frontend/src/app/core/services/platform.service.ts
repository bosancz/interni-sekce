import { Injectable, signal } from "@angular/core";
import { Platform } from "@ionic/angular/standalone";
import { BehaviorSubject, Observable } from "rxjs";
import { Logger } from "src/logger";

export class TriggerSubject<T> extends BehaviorSubject<T> {
	constructor(
		private readonly fn: () => T,
		trigger?: Observable<any>,
	) {
		super(fn());
		trigger?.subscribe(() => this.trigger());
	}

	trigger() {
		this.next(this.fn());
	}
}

@Injectable({
	providedIn: "root",
})
export class PlatformService {
	private readonly logger = new Logger("PlatformService");

	isLg = new TriggerSubject(() => this.platform.width() >= 992, this.platform.resize);

	isPortrait = new TriggerSubject<boolean>(() => this.platform.isPortrait(), this.platform.resize);
	isLandscape = new TriggerSubject<boolean>(() => this.platform.isLandscape(), this.platform.resize);

	isMobile = new TriggerSubject(() => this.platform.is("android") || this.platform.is("ios"));
	isIos = new TriggerSubject(() => this.platform.is("ios"));

	isTouch = signal(typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);

	private readonly standaloneQuery = window.matchMedia(
		"(display-mode: standalone), (display-mode: window-controls-overlay), (display-mode: fullscreen)",
	);

	isStandalone = signal(
		this.standaloneQuery.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
	);

	constructor(private readonly platform: Platform) {
		window.addEventListener(
			"pointerdown",
			(event: PointerEvent) => {
				if (event.pointerType === "touch") this.isTouch.set(true);
			},
			{ capture: true, passive: true },
		);

		this.standaloneQuery.addEventListener("change", (event) => this.isStandalone.set(event.matches));
	}
}
