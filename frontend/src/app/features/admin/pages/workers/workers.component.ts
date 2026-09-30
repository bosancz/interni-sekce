import { DatePipe } from "@angular/common";
import { Component, OnDestroy, OnInit, signal } from "@angular/core";
import { IonButton, IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { hardwareChipOutline, refreshOutline, serverOutline } from "ionicons/icons";
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

const REFRESH_MS = 5_000;

const STATUS_LABELS: Record<SDK.WorkerStatusEnum, { label: string; pill: string }> = {
	busy: { label: "Pracuje", pill: "bo-pill-yellow" },
	idle: { label: "Čeká na úlohu", pill: "bo-pill-green" },
	stale: { label: "Neodpovídá", pill: "bo-pill-red" },
};

@Component({
	selector: "bo-workers",
	templateUrl: "./workers.component.html",
	styleUrl: "./workers.component.scss",
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
export class WorkersComponent implements OnInit, OnDestroy {
	workers = signal<SDK.WorkerResponse[] | undefined>(undefined);
	now = signal(Date.now());

	statusLabels = STATUS_LABELS;

	private timer?: ReturnType<typeof setInterval>;

	constructor(
		private api: ApiService,
		private toastService: ToastService,
	) {
		addIcons({ hardwareChipOutline, refreshOutline, serverOutline });
	}

	ngOnInit() {
		this.load();
		this.timer = setInterval(() => this.load(), REFRESH_MS);
	}

	ngOnDestroy() {
		clearInterval(this.timer);
	}

	async load() {
		try {
			this.workers.set(await this.api.WorkerApi.listWorkers().then((res) => res.data));
			this.now.set(Date.now());
		} catch {
			this.toastService.toast("Nepodařilo se načíst workery.", { color: "warning" });
		}
	}

	cpuLabel(worker: SDK.WorkerResponse) {
		if (worker.cpuLimit) return `${formatNumber(worker.cpuLimit)} (${worker.cpus} vláken)`;
		return `bez limitu (${worker.cpus} jader)`;
	}

	memoryLabel(worker: SDK.WorkerResponse) {
		const usage = worker.memoryUsage != null ? formatBytes(worker.memoryUsage) : "—";
		if (!worker.memoryLimit) return `${usage} / bez limitu`;
		return `${usage} / ${formatBytes(worker.memoryLimit)}`;
	}

	memoryPercent(worker: SDK.WorkerResponse) {
		if (!worker.memoryLimit || worker.memoryUsage == null) return null;
		return Math.min(100, Math.round((worker.memoryUsage / worker.memoryLimit) * 100));
	}

	duration(from: string) {
		const seconds = Math.max(0, Math.round((this.now() - new Date(from).getTime()) / 1000));
		if (seconds < 60) return `${seconds} s`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes} min ${seconds % 60} s`;
		const hours = Math.floor(minutes / 60);
		if (hours < 48) return `${hours} h ${minutes % 60} min`;
		return `${Math.floor(hours / 24)} d ${hours % 24} h`;
	}
}

function formatNumber(value: number) {
	return value.toLocaleString("cs-CZ", { maximumFractionDigits: 2 });
}

function formatBytes(bytes: number) {
	const units = ["B", "kB", "MB", "GB", "TB"];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}
	return `${formatNumber(Math.round(value * 10) / 10)} ${units[unit]}`;
}
