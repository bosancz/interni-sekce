import { Component, computed, signal } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { SwUpdate } from "@angular/service-worker";
import { IonSpinner } from "@ionic/angular/standalone";
import { filter, map } from "rxjs";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ChangelogModalComponent } from "src/app/shared/components/changelog-modal/changelog-modal.component";
import { Config } from "src/config";
import { Logger } from "src/logger";

@Component({
	selector: "bo-version",
	templateUrl: "./version.component.html",
	styleUrl: "./version.component.scss",
	imports: [IonSpinner],
})
export class VersionComponent {
	private readonly logger = new Logger("VersionComponent");

	version = this.config.version.replace(/^v(?=\d)/, "");
	updateAvailable = signal(false);
	updating = signal(false);

	private readonly apiVersion = toSignal(this.api.info.pipe(map((info) => info.version.replace(/^v(?=\d)/, ""))));

	newVersion = computed(() => {
		const apiVersion = this.apiVersion();
		return apiVersion && apiVersion !== this.version ? apiVersion : null;
	});

	private updateCheck?: Promise<boolean>;

	constructor(
		private readonly config: Config,
		private readonly swUpdate: SwUpdate,
		private readonly modal: ModalService,
		private readonly api: ApiService,
	) {
		this.swUpdate.versionUpdates
			.pipe(
				filter((event) => event.type === "VERSION_DETECTED" || event.type === "VERSION_READY"),
				takeUntilDestroyed(),
			)
			.subscribe((event) => {
				this.logger.log("New version detected:", event.type);
				this.updateAvailable.set(true);
			});

		this.checkForUpdates();
	}

	private async checkForUpdates(): Promise<void> {
		if (!this.swUpdate.isEnabled) return;

		this.logger.debug("Checking for updates...");
		this.updateCheck = this.swUpdate.checkForUpdate();

		try {
			const updateAvailable = await this.updateCheck;
			if (updateAvailable) this.updateAvailable.set(true);
			this.logger.log("Update available:", updateAvailable);
		} catch {
			this.logger.error("Error while checking for updates");
		} finally {
			this.logger.debug("Update check completed");
		}
	}

	async doUpdate(): Promise<void> {
		this.updating.set(true);

		try {
			await this.updateCheck;
			await this.swUpdate.activateUpdate();
			document.location.reload();
		} catch {
			this.updating.set(false);
			this.logger.error("Error while activating the update");
		}
	}

	openChangelog(): void {
		this.modal.componentModal(ChangelogModalComponent);
	}
}
