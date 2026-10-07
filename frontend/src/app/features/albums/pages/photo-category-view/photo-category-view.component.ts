import { Component, computed, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import {
	InfiniteScrollCustomEvent,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonSpinner,
} from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { PhotoHitsGridComponent } from "src/app/shared/components/photo-hits-grid/photo-hits-grid.component";
import { SDK } from "src/sdk";

const PAGE_SIZE = 60;

@UntilDestroy()
@Component({
	selector: "bo-photo-category-view",
	templateUrl: "./photo-category-view.component.html",
	styleUrl: "./photo-category-view.component.scss",
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		PhotoHitsGridComponent,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		IonSpinner,
	],
})
export class PhotoCategoryViewComponent {
	category = signal<SDK.PhotoCategoryResponseWithLinks | undefined>(undefined);
	photos = signal<SDK.PhotoContentSearchHitResponse[] | undefined>(undefined);
	hasMore = signal(false);

	title = computed(() => this.category()?.name ?? "Kategorie");

	private categoryId?: number;

	constructor(
		private api: ApiService,
		private route: ActivatedRoute,
		private toastService: ToastService,
	) {
		this.route.params.pipe(untilDestroyed(this)).subscribe((params) => this.load(parseInt(params["category"])));
	}

	async load(categoryId: number) {
		this.categoryId = categoryId;
		this.category.set(undefined);
		this.photos.set(undefined);

		try {
			const [category, photos] = await Promise.all([
				this.api.WorkerApi.getPhotoCategory(categoryId).then((res) => res.data),
				this.api.WorkerApi.listPhotoCategoryPhotos(categoryId, { limit: PAGE_SIZE }).then((res) => res.data),
			]);
			if (this.categoryId !== categoryId) return;
			this.category.set(category);
			this.photos.set(photos);
			this.hasMore.set(photos.length === PAGE_SIZE);
		} catch {
			this.photos.set([]);
			this.toastService.toast("Kategorii se nepodařilo načíst.", { color: "danger" });
		}
	}

	async loadMore(event: Event) {
		const categoryId = this.categoryId;
		const current = this.photos() ?? [];

		try {
			if (categoryId !== undefined) {
				const page = await this.api.WorkerApi.listPhotoCategoryPhotos(categoryId, {
					limit: PAGE_SIZE,
					offset: current.length,
				}).then((res) => res.data);
				if (this.categoryId === categoryId) {
					this.photos.set([...current, ...page]);
					this.hasMore.set(page.length === PAGE_SIZE);
				}
			}
		} finally {
			(event as InfiniteScrollCustomEvent).target.complete();
		}
	}
}
