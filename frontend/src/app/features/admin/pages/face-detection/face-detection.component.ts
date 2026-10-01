import { DatePipe } from "@angular/common";
import { Component, computed, OnDestroy, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonButton, IonIcon, IonSkeletonText, IonSpinner } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { chevronForwardOutline, happyOutline, listOutline, playOutline, refreshOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { PhotoFaceImageUrlPipe } from "src/app/shared/pipes/photo-face-image-url.pipe";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { faceEmotionLabel } from "src/helpers/face-emotions";
import { SDK } from "src/sdk";

const LOG_PAGE_SIZE = 30;
const REFRESH_MS = 10_000;

@Component({
	selector: "bo-face-detection",
	templateUrl: "./face-detection.component.html",
	styleUrl: "./face-detection.component.scss",
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		IonButton,
		IonIcon,
		IonSpinner,
		IonSkeletonText,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		DatePipe,
		RouterLink,
		PhotoImageUrlPipe,
		PhotoFaceImageUrlPipe,
		TooltipDirective,
	],
})
export class FaceDetectionComponent implements OnInit, OnDestroy {
	summary = signal<SDK.FaceDetectionSummaryResponse | undefined>(undefined);
	log = signal<SDK.FaceDetectionLogEntryResponse[]>([]);
	logLoading = signal(false);
	logHasMore = signal(false);
	queueing = signal(false);

	workers = signal<SDK.WorkerResponse[] | undefined>(undefined);
	liveWorkers = computed(() => this.workers()?.filter((worker) => worker.status !== "stale").length ?? 0);

	canRunBatch = computed(() => this.api.links()?.enqueueFaceDetectionBatch.allowed ?? false);
	canAccessMatching = computed(() => this.api.links()?.getFaceMatchingSummary.allowed ?? false);
	canAccessWorkers = computed(() => this.api.links()?.listWorkers.allowed ?? false);
	queueBusy = computed(() => {
		const queue = this.summary()?.queue;
		return !!queue && queue.waiting + queue.active + queue.delayed > 0;
	});

	private timer?: ReturnType<typeof setInterval>;

	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ chevronForwardOutline, happyOutline, listOutline, playOutline, refreshOutline });
	}

	ngOnInit() {
		this.refresh();
		this.timer = setInterval(() => this.poll(), REFRESH_MS);
	}

	ngOnDestroy() {
		clearInterval(this.timer);
	}

	async refresh() {
		await Promise.all([this.loadSummary(), this.loadLog(true)]);
	}

	private async poll() {
		const wasBusy = this.queueBusy();
		await this.loadSummary();
		if ((wasBusy || this.queueBusy()) && this.log().length <= LOG_PAGE_SIZE) await this.loadLog(true);
	}

	private async loadSummary() {
		try {
			const [summary, workers] = await Promise.all([
				this.api.WorkerApi.getFaceDetectionSummary().then((res) => res.data),
				this.canAccessWorkers()
					? this.api.WorkerApi.listWorkers().then((res) => res.data)
					: Promise.resolve(undefined),
			]);
			this.summary.set(summary);
			this.workers.set(workers);
		} catch {
			this.toastService.toast("Nepodařilo se načíst stav rozpoznávání.", { color: "warning" });
		}
	}

	async loadLog(reset = false) {
		if (this.logLoading()) return;
		this.logLoading.set(true);

		try {
			const offset = reset ? 0 : this.log().length;
			const page = await this.api.WorkerApi.listFaceDetectionLog({ limit: LOG_PAGE_SIZE, offset }).then(
				(res) => res.data,
			);
			this.log.set(reset ? page : [...this.log(), ...page]);
			this.logHasMore.set(page.length === LOG_PAGE_SIZE);
		} finally {
			this.logLoading.set(false);
		}
	}

	async runBatch() {
		const summary = this.summary();
		if (!summary?.enabled || !this.canRunBatch()) return;

		const count = Math.min(summary.schedule.batchSize, summary.photos.pending);
		if (!count) {
			this.toastService.toast("Všechny fotky už jsou zpracované.");
			return;
		}

		const confirmed = await this.modalService.confirmationModal(
			`Do fronty se zařadí ${count} nejnovějších nezpracovaných fotek a worker je začne zpracovávat hned, mimo noční okno.`,
			{ header: "Spustit dávku teď?", buttonText: "Spustit" },
		);
		if (!confirmed) return;

		this.queueing.set(true);
		try {
			const { queued } = await this.api.WorkerApi.enqueueFaceDetectionBatch({}).then((res) => res.data);
			this.toastService.toast(`Zařazeno ${queued} fotek.`);
			await this.loadSummary();
		} catch {
			this.toastService.toast("Dávku se nepodařilo spustit.", { color: "danger" });
		} finally {
			this.queueing.set(false);
		}
	}

	faceTooltip(face: SDK.FaceDetectionLogFaceResponse) {
		const member =
			face.memberNickname && face.assignment === "auto" ? `${face.memberNickname}?` : face.memberNickname;
		return [member || "Nepřiřazeno", this.scorePercent(face.score), faceEmotionLabel(face)]
			.filter(Boolean)
			.join(" · ");
	}

	scorePercent(score: number | null | undefined) {
		return score == null ? "" : `${Math.round(score * 100)} %`;
	}
}
