import { DatePipe, DecimalPipe } from "@angular/common";
import { Component, computed, OnDestroy, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonButton, IonIcon, IonSearchbar, IonSkeletonText, IonSpinner } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
	addOutline,
	chevronForwardOutline,
	imagesOutline,
	playOutline,
	pricetagsOutline,
	refreshOutline,
	searchOutline,
} from "ionicons/icons";
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
import { PhotoHitsGridComponent } from "src/app/shared/components/photo-hits-grid/photo-hits-grid.component";
import { SDK } from "src/sdk";

const REFRESH_MS = 10_000;
const SEARCH_LIMIT = 60;

@Component({
	selector: "bo-photo-content",
	templateUrl: "./photo-content.component.html",
	styleUrl: "./photo-content.component.scss",
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		IonButton,
		IonIcon,
		IonSearchbar,
		IonSkeletonText,
		IonSpinner,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		DatePipe,
		DecimalPipe,
		RouterLink,
		PhotoHitsGridComponent,
		TooltipDirective,
	],
})
export class PhotoContentComponent implements OnInit, OnDestroy {
	readonly examples = ["voda", "krajina", "uvnitř", "kolo", "lyže", "sníh", "táborák", "stan", "hory", "les"];

	summary = signal<SDK.PhotoContentSummaryResponse | undefined>(undefined);
	categories = signal<SDK.PhotoCategoryResponseWithLinks[] | undefined>(undefined);
	queueing = signal(false);

	query = signal("");
	searchedQuery = signal("");
	results = signal<SDK.PhotoContentSearchHitResponse[]>([]);
	searching = signal(false);

	canRunBatch = computed(() => this.api.links()?.enqueuePhotoContentBatch.allowed ?? false);
	canCreateCategory = computed(() => this.api.links()?.createPhotoCategory.allowed ?? false);
	canSearch = computed(() => this.api.links()?.searchPhotoContent.allowed ?? false);
	queueRemaining = computed(() => {
		const queue = this.summary()?.queue;
		return queue ? queue.waiting + queue.active + queue.delayed : 0;
	});

	private timer?: ReturnType<typeof setInterval>;
	private searchId = 0;

	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({
			addOutline,
			chevronForwardOutline,
			imagesOutline,
			playOutline,
			pricetagsOutline,
			refreshOutline,
			searchOutline,
		});
	}

	ngOnInit() {
		this.loadSummary();
		this.timer = setInterval(() => this.loadSummary(), REFRESH_MS);
	}

	ionViewWillEnter() {
		this.loadCategories();
	}

	ngOnDestroy() {
		clearInterval(this.timer);
	}

	async loadSummary() {
		try {
			this.summary.set(await this.api.WorkerApi.getPhotoContentSummary().then((res) => res.data));
		} catch {
			this.toastService.toast("Nepodařilo se načíst stav rozpoznávání.", { color: "warning" });
		}
	}

	async loadCategories() {
		try {
			this.categories.set(await this.api.WorkerApi.listPhotoCategories().then((res) => res.data));
		} catch {
			this.categories.set([]);
		}
	}

	async runBatch() {
		const summary = this.summary();
		if (!summary?.enabled || !this.canRunBatch()) return;

		const count = Math.min(summary.batchSize, summary.photos.pending);
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
			const { queued } = await this.api.WorkerApi.enqueuePhotoContentBatch({}).then((res) => res.data);
			this.toastService.toast(`Zařazeno ${queued} fotek.`);
			await this.loadSummary();
		} catch {
			this.toastService.toast("Dávku se nepodařilo spustit.", { color: "danger" });
		} finally {
			this.queueing.set(false);
		}
	}

	setExample(text: string) {
		this.query.set(text);
		this.search();
	}

	onQueryChange(value: string | null | undefined) {
		this.query.set(value ?? "");
		this.search();
	}

	async search() {
		const q = this.query().trim();
		const searchId = ++this.searchId;

		if (!q) {
			this.results.set([]);
			this.searchedQuery.set("");
			return;
		}

		this.searching.set(true);
		try {
			const results = await this.api.WorkerApi.searchPhotoContent({ q, limit: SEARCH_LIMIT }).then(
				(res) => res.data,
			);
			if (searchId !== this.searchId) return;
			this.results.set(results);
			this.searchedQuery.set(q);
		} catch {
			if (searchId !== this.searchId) return;
			this.toastService.toast("Hledání se nepovedlo — běží worker s úlohou embed-text?", { color: "danger" });
		} finally {
			if (searchId === this.searchId) this.searching.set(false);
		}
	}
}
