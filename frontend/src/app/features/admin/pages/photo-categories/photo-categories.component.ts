import { DecimalPipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterLink } from "@angular/router";
import { IonButton, IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { createOutline, pricetagOutline } from "ionicons/icons";
import { filter } from "rxjs";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { SDK } from "src/sdk";

const PREVIEW_PHOTOS = 6;
const PAGE_URL = "/admin/fotky/kategorie";

interface CategoryCard {
	category: SDK.PhotoCategoryResponseWithLinks;
	photos: SDK.PhotoContentSearchHitResponse[];
}

@Component({
	selector: "bo-photo-categories",
	templateUrl: "./photo-categories.component.html",
	styleUrl: "./photo-categories.component.scss",
	imports: [
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		IonButton,
		IonIcon,
		IonSkeletonText,
		RouterLink,
		DecimalPipe,
		PhotoImageUrlPipe,
		TooltipDirective,
	],
})
export class PhotoCategoriesComponent implements OnInit {
	readonly previewPhotos = PREVIEW_PHOTOS;

	cards = signal<CategoryCard[] | undefined>(undefined);

	constructor(
		private api: ApiService,
		private router: Router,
		private toastService: ToastService,
	) {
		addIcons({ createOutline, pricetagOutline });

		this.router.events
			.pipe(
				filter((event) => event instanceof NavigationEnd && event.urlAfterRedirects.split("?")[0] === PAGE_URL),
				takeUntilDestroyed(),
			)
			.subscribe(() => this.load());
	}

	ngOnInit() {
		this.load();
	}

	async load() {
		try {
			const categories = await this.api.WorkerApi.listPhotoCategories().then((res) => res.data);
			const photos = await Promise.all(
				categories.map((category) =>
					category.photosCount
						? this.api.WorkerApi.listPhotoCategoryPhotos(category.id, { limit: PREVIEW_PHOTOS })
								.then((res) => res.data)
								.catch(() => [])
						: Promise.resolve([]),
				),
			);
			this.cards.set(categories.map((category, i) => ({ category, photos: photos[i] })));
		} catch {
			this.cards.set([]);
			this.toastService.toast("Kategorie se nepodařilo načíst.", { color: "danger" });
		}
	}
}
