import { Component, computed, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { IonIcon, IonSpinner } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { addOutline, pencil, pricetagOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { GalleryViewSwitchComponent } from "src/app/features/albums/components/gallery-view-switch/gallery-view-switch.component";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageFooterComponent } from "src/app/shared/components/page-footer/page-footer.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { SDK } from "src/sdk";

const PREVIEW_PHOTOS = 4;

interface CategoryCard {
	category: SDK.PhotoCategoryResponseWithLinks;
	photoIds: number[];
}

@Component({
	selector: "bo-photo-categories-list",
	templateUrl: "./photo-categories-list.component.html",
	styleUrl: "./photo-categories-list.component.scss",
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		PageFooterComponent,
		GalleryViewSwitchComponent,
		RouterLink,
		PhotoImageUrlPipe,
		TooltipDirective,
		IonIcon,
		IonSpinner,
	],
})
export class PhotoCategoriesListComponent {
	cards = signal<CategoryCard[] | undefined>(undefined);
	visibleCards = computed(() => this.cards()?.filter((card) => card.category.photosCount) ?? []);

	actions = computed<Action[]>(() => [
		{
			text: "Nová kategorie",
			icon: "add-outline",
			pinned: true,
			disabled: !this.api.links()?.createPhotoCategory.allowed,
			handler: () => this.create(),
		},
	]);

	constructor(
		private api: ApiService,
		private router: Router,
		private toastService: ToastService,
	) {
		addIcons({ addOutline, pencil, pricetagOutline });
	}

	ionViewWillEnter() {
		this.load();
	}

	create() {
		this.router.navigate(["/admin/fotky/kategorie/nova"], { queryParams: { zpet: "/galerie/kategorie" } });
	}

	async load() {
		try {
			const categories = await this.api.WorkerApi.listPhotoCategories().then((res) => res.data);
			const photos = await Promise.all(
				categories.map((category) =>
					category.photosCount
						? this.api.WorkerApi.listPhotoCategoryPhotos(category.id, { limit: PREVIEW_PHOTOS })
								.then((res) => res.data.map((hit) => hit.photoId))
								.catch(() => [])
						: Promise.resolve([]),
				),
			);
			this.cards.set(categories.map((category, i) => ({ category, photoIds: photos[i] })));
		} catch {
			this.cards.set([]);
			this.toastService.toast("Kategorie se nepodařilo načíst.", { color: "danger" });
		}
	}
}
