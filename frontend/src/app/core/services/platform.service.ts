import { Injectable } from "@angular/core";
import { Platform } from "@ionic/angular";
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

	isMobile = new TriggerSubject(() => this.platform.is("mobile"));
	isIos = new TriggerSubject(() => this.platform.is("ios"));

	constructor(private readonly platform: Platform) {}
}
