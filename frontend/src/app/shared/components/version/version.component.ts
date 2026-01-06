import { Component, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { SwUpdate } from "@angular/service-worker";
import { map } from "rxjs";
import { ApiService } from "src/app/services/api.service";
import { Logger } from "src/logger";

@Component({
	selector: "bo-version",
	standalone: false,
	templateUrl: "./version.component.html",
	styleUrl: "./version.component.scss",
})
export class VersionComponent {
	private readonly logger = new Logger("VersionComponent");

	version = toSignal(this.api.info.pipe(map((info) => info.version)));
	updateStatus = signal<"checking" | "available" | "unavailable" | "error">("available");

	constructor(
		private readonly api: ApiService,
		private readonly swUpdate: SwUpdate,
	) {
		this.checkForUpdates();
	}

	private async checkForUpdates(): Promise<void> {
		if (this.swUpdate.isEnabled) {
			this.updateStatus.set("checking");
			this.logger.debug("Checking for updates...");

			try {
				const updateAvailable = await this.swUpdate.checkForUpdate();
				this.updateStatus.set(updateAvailable ? "available" : "unavailable");

				this.logger.log("Update available:", updateAvailable);
			} catch {
				this.updateStatus.set("error");
				this.logger.error("Error while checking for updates");
			} finally {
				this.logger.debug("Update check completed");
			}
		}
	}

	doUpdate(): void {
		this.swUpdate.activateUpdate().then(() => document.location.reload());
	}
}
