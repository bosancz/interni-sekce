import { Component, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { SwUpdate } from "@angular/service-worker";
import { IonSpinner } from "@ionic/angular/standalone";
import { map } from "rxjs";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ChangelogModalComponent } from "src/app/shared/components/changelog-modal/changelog-modal.component";
import { Logger } from "src/logger";

@Component({
	selector: "bo-version",
	templateUrl: "./version.component.html",
	styleUrl: "./version.component.scss",
	imports: [IonSpinner],
})
export class VersionComponent {
	private readonly logger = new Logger("VersionComponent");

	version = toSignal(this.api.info.pipe(map((info) => info.version)));
	updateStatus = signal<"checking" | "available" | "unavailable" | "error">("unavailable");

	constructor(
		private readonly api: ApiService,
		private readonly swUpdate: SwUpdate,
		private readonly modal: ModalService,
	) {
		this.checkForUpdates();
	}

	private async checkForUpdates(): Promise<void> {
		if (!this.swUpdate.isEnabled) return;

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

	doUpdate(): void {
		this.swUpdate.activateUpdate().then(() => document.location.reload());
	}

	openChangelog(): void {
		this.modal.componentModal(ChangelogModalComponent);
	}
}
