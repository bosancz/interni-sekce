import { DatePipe } from "@angular/common";
import { Component, OnInit, computed, signal } from "@angular/core";
import { IonButton, IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
	calendarOutline,
	documentsOutline,
	logoGoogle,
	refreshOutline,
	serverOutline,
	timeOutline,
	warningOutline,
} from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { SDK } from "src/sdk";

const STATUS_LABELS: Record<SDK.BackupRunStatusesEnum, { label: string; pill: string }> = {
	running: { label: "Běží", pill: "bo-pill-yellow" },
	ok: { label: "V pořádku", pill: "bo-pill-green" },
	error: { label: "Chyba", pill: "bo-pill-red" },
};

const TYPE_LABELS: Record<SDK.BackupRunTypesEnum, string> = {
	database: "Databáze",
	files: "Soubory",
};

@Component({
	selector: "bo-backups",
	templateUrl: "./backups.component.html",
	styleUrl: "./backups.component.scss",
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		IonButton,
		IonIcon,
		IonSkeletonText,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		DatePipe,
		TooltipDirective,
	],
})
export class BackupsComponent implements OnInit {
	backups = signal<SDK.BackupsSummaryResponse | undefined>(undefined);

	cards = computed(() => {
		const backups = this.backups();
		if (!backups) return [];
		return [
			{ type: SDK.BackupRunTypesEnum.Database, last: backups.lastDatabase, success: backups.lastDatabaseSuccess },
			{ type: SDK.BackupRunTypesEnum.Files, last: backups.lastFiles, success: backups.lastFilesSuccess },
		];
	});

	statusLabels = STATUS_LABELS;
	typeLabels = TYPE_LABELS;

	constructor(
		private api: ApiService,
		private toastService: ToastService,
	) {
		addIcons({
			calendarOutline,
			documentsOutline,
			logoGoogle,
			refreshOutline,
			serverOutline,
			timeOutline,
			warningOutline,
		});
	}

	ngOnInit() {
		this.load();
	}

	async load() {
		try {
			this.backups.set(await this.api.BackupsApi.getBackups().then((res) => res.data));
		} catch {
			this.toastService.toast("Nepodařilo se načíst stav záloh.", { color: "warning" });
		}
	}

	ago(value: string | null | undefined) {
		if (!value) return "";
		const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
		if (minutes < 60) return `před ${minutes} min`;
		const hours = Math.floor(minutes / 60);
		if (hours < 48) return `před ${hours} h`;
		return `před ${Math.floor(hours / 24)} dny`;
	}

	duration(run: SDK.BackupRunResponse) {
		if (!run.finishedAt) return null;
		const seconds = Math.max(
			0,
			Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000),
		);
		if (seconds < 60) return `${seconds} s`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes} min ${seconds % 60} s`;
		return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
	}

	bytes(value: number | null | undefined) {
		if (value == null) return null;
		const units = ["B", "kB", "MB", "GB", "TB"];
		let size = value;
		let unit = 0;
		while (size >= 1024 && unit < units.length - 1) {
			size /= 1024;
			unit++;
		}
		return `${(Math.round(size * 10) / 10).toLocaleString("cs-CZ")} ${units[unit]}`;
	}

	files(count: number) {
		if (count === 1) return "1 soubor";
		if (count >= 2 && count <= 4) return `${count} soubory`;
		return `${count.toLocaleString("cs-CZ")} souborů`;
	}

	percent(progress: SDK.BackupRunProgressResponse) {
		if (!progress.totalBytes) return 0;
		return Math.min(100, Math.floor((progress.bytes / progress.totalBytes) * 100));
	}

	progressText(progress: SDK.BackupRunProgressResponse) {
		return [
			`${this.bytes(progress.bytes)} z ${this.bytes(progress.totalBytes)} (${this.percent(progress)} %)`,
			`${progress.transfers.toLocaleString("cs-CZ")} z ${this.files(progress.totalTransfers)}`,
			`${this.bytes(progress.speed)}/s`,
		].join(" · ");
	}

	progressMeta(progress: SDK.BackupRunProgressResponse) {
		const parts = [`běží ${this.seconds(progress.elapsed)}`];
		if (progress.eta) parts.push(`zbývá asi ${this.seconds(progress.eta)}`);
		parts.push(`aktualizováno ${this.ago(progress.updatedAt)}`);
		return parts.join(" · ");
	}

	seconds(value: number) {
		const minutes = Math.floor(value / 60);
		if (minutes < 60) return `${minutes} min`;
		const hours = Math.floor(minutes / 60);
		if (hours < 48) return `${hours} h ${minutes % 60} min`;
		return `${Math.floor(hours / 24)} d ${hours % 24} h`;
	}

	details(run: SDK.BackupRunResponse) {
		if (run.status === "running" && run.progress) return this.progressText(run.progress);
		const parts: string[] = [];
		if (run.type === "database") {
			const size = this.bytes(run.bytes);
			if (size) parts.push(size);
		} else {
			if (run.filesTransferred != null)
				parts.push(`nahráno ${this.files(run.filesTransferred)} (${this.bytes(run.bytes ?? 0)})`);
			if (run.filesRemoved) parts.push(`${run.filesRemoved} do smazaných`);
		}
		const duration = this.duration(run);
		if (duration) parts.push(duration);
		return parts.join(" · ");
	}
}
