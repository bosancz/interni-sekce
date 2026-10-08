import { Component, computed, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonIcon, IonSpinner } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { pricetagOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { SDK } from "src/sdk";

interface CategoryCard {
	category: SDK.PhotoCategoryResponseWithLinks;
	coverPhotoId: number | null;
}

@Component({
	selector: "bo-photo-categories-list",
	templateUrl: "./photo-categories-list.component.html",
	styleUrl: "./photo-categories-list.component.scss",
	imports: [PageHeaderComponent, PageContentComponent, RouterLink, PhotoImageUrlPipe, IonIcon, IonSpinner],
})
export class PhotoCategoriesListComponent {
	cards = signal<CategoryCard[] | undefined>(undefined);
	visibleCards = computed(() => this.cards()?.filter((card) => card.category.photosCount) ?? []);

	constructor(
		private api: ApiService,
		private toastService: ToastService,
	) {
		addIcons({ pricetagOutline });
	}

	ionViewWillEnter() {
		this.load();
	}

	async load() {
		try {
			const categories = await this.api.WorkerApi.listPhotoCategories().then((res) => res.data);
			const covers = await Promise.all(
				categories.map((category) =>
					category.photosCount
						? this.api.WorkerApi.listPhotoCategoryPhotos(category.id, { limit: 1 })
								.then((res) => res.data[0]?.photoId ?? null)
								.catch(() => null)
						: Promise.resolve(null),
				),
			);
			this.cards.set(categories.map((category, i) => ({ category, coverPhotoId: covers[i] })));
		} catch {
			this.cards.set([]);
			this.toastService.toast("Kategorie se nepodařilo načíst.", { color: "danger" });
		}
	}
}
