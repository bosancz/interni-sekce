import { DatePipe } from "@angular/common";
import { Component, computed, OnDestroy, OnInit, signal } from "@angular/core";
import { IonButton, IonIcon, IonProgressBar, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { optionsOutline, peopleOutline, refreshOutline, statsChartOutline } from "ionicons/icons";
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

const REFRESH_MS = 10_000;
const REFRESH_RUNNING_MS = 2_000;
const THRESHOLD_DIFF_WARNING = 0.02;
const SWEEP_TABLE_STEP = 0.05;

const TRIGGER_LABELS: Record<SDK.FaceMatchingTriggerEnum, string> = {
	all: "celý přepočet",
	changes: "po ruční změně",
};

@Component({
	selector: "bo-face-matching",
	templateUrl: "./face-matching.component.html",
	styleUrl: "./face-matching.component.scss",
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		IonButton,
		IonIcon,
		IonProgressBar,
		IonSkeletonText,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		DatePipe,
		TooltipDirective,
	],
})
export class FaceMatchingComponent implements OnInit, OnDestroy {
	summary = signal<SDK.FaceMatchingSummaryResponse | undefined>(undefined);
	starting = signal(false);

	canRunMatching = computed(() => this.api.links()?.runFaceMatching.allowed ?? false);

	busy = computed(() => {
		const status = this.summary()?.status;
		return !!status && (!!status.current || status.queued);
	});

	progress = computed(() => {
		const current = this.summary()?.status.current;
		if (!current?.photos) return undefined;
		return current.processed / current.photos;
	});

	thresholdDiff = computed(() => {
		const summary = this.summary();
		const proposed = summary?.analysis.proposed;
		if (!summary || !proposed) return undefined;
		return Math.round((proposed.threshold - summary.settings.threshold) * 100) / 100;
	});

	thresholdOutdated = computed(() => Math.abs(this.thresholdDiff() ?? 0) >= THRESHOLD_DIFF_WARNING);

	sweepRows = computed(() => {
		const analysis = this.summary()?.analysis;
		if (!analysis?.decisions) return [];

		const current = this.summary()!.settings.threshold;
		const proposed = analysis.proposed?.threshold;

		return analysis.sweep.filter(
			(row) =>
				row.threshold === current ||
				row.threshold === proposed ||
				Math.abs(Math.round(row.threshold / SWEEP_TABLE_STEP) * SWEEP_TABLE_STEP - row.threshold) < 1e-6,
		);
	});

	private timer?: ReturnType<typeof setTimeout>;
	private destroyed = false;

	constructor(
		private api: ApiService,
		private toastService: ToastService,
	) {
		addIcons({ optionsOutline, peopleOutline, refreshOutline, statsChartOutline });
	}

	ngOnInit() {
		this.poll();
	}

	ngOnDestroy() {
		this.destroyed = true;
		clearTimeout(this.timer);
	}

	async refresh() {
		clearTimeout(this.timer);
		await this.poll();
	}

	private async poll() {
		await this.loadSummary();
		if (this.destroyed) return;
		this.timer = setTimeout(() => this.poll(), this.busy() ? REFRESH_RUNNING_MS : REFRESH_MS);
	}

	private async loadSummary() {
		try {
			this.summary.set(await this.api.WorkerApi.getFaceMatchingSummary().then((res) => res.data));
		} catch {
			this.toastService.toast("Nepodařilo se načíst stav přiřazování.", { color: "warning" });
		}
	}

	async runMatching() {
		if (!this.canRunMatching()) return;

		this.starting.set(true);
		try {
			await this.api.WorkerApi.runFaceMatching();
			await this.refresh();
		} catch {
			this.toastService.toast("Přepočet přiřazení se nepodařil.", { color: "danger" });
		} finally {
			this.starting.set(false);
		}
	}

	triggerLabel(trigger: SDK.FaceMatchingTriggerEnum) {
		return TRIGGER_LABELS[trigger];
	}

	duration(run: SDK.FaceMatchingRunResponse) {
		const seconds = Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000);
		return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
	}

	score(value: number) {
		return value.toFixed(2);
	}

	signedScore(value: number) {
		return `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value).toFixed(2)}`;
	}

	percent(value: number | null | undefined) {
		return value == null ? "—" : `${Math.round(value * 100)} %`;
	}
}
