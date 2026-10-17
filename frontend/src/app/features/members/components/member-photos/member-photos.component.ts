import { Component, computed, effect, input, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
	InfiniteScrollCustomEvent,
	IonIcon,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonSpinner,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { imagesOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { PhotosEditComponent } from "src/app/features/albums/components/photos-edit/photos-edit.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardOpenButtonComponent } from "src/app/shared/components/card-open-button/card-open-button.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { PhotoGalleryComponent } from "src/app/shared/components/photo-gallery/photo-gallery.component";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { groupPhotosByAlbum } from "src/helpers/album-photos";
import { SDK } from "src/sdk";

const PAGE_SIZE = 30;
const LOAD_PAGE_SIZE = 200;

@Component({
	selector: "bo-member-photos",
	templateUrl: "./member-photos.component.html",
	styleUrl: "./member-photos.component.scss",
	imports: [
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		CardOpenButtonComponent,
		PhotoGalleryComponent,
		DateRangePipe,
		RouterLink,
		IonIcon,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		IonSpinner,
	],
})
export class MemberPhotosComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
	active = input(true);

	photos = signal<SDK.PhotoResponseWithLinks[]>([]);
	loading = signal(false);
	visibleCount = signal(PAGE_SIZE);

	hasMore = computed(() => this.visibleCount() < this.photos().length);
	albums = computed(() => groupPhotosByAlbum(this.photos().slice(0, this.visibleCount())));
	allPhotos = computed(() => groupPhotosByAlbum(this.photos()).flatMap((group) => group.photos));

	private loadedFor?: number;

	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ imagesOutline });

		effect(() => {
			const member = this.member();
			if (!member || member.id === this.loadedFor) return;
			this.loadedFor = member.id;
			this.photos.set([]);
			this.visibleCount.set(PAGE_SIZE);
			if (member._links.listMemberPhotos.allowed) this.load(member);
		});
	}

	async load(member: SDK.MemberResponseWithLinks) {
		this.loading.set(true);

		try {
			const photos: SDK.PhotoResponseWithLinks[] = [];
			while (true) {
				const page = await this.api.MembersApi.listMemberPhotos(member.id, {
					limit: LOAD_PAGE_SIZE,
					offset: photos.length,
				}).then((res) => res.data as unknown as SDK.PhotoResponseWithLinks[]);
				if (this.member()?.id !== member.id) return;
				photos.push(...page);
				if (page.length < LOAD_PAGE_SIZE) break;
			}
			this.photos.set(photos);
		} catch {
			this.toastService.toast("Nepodařilo se načíst fotky.", { color: "warning" });
		} finally {
			this.loading.set(false);
		}
	}

	onInfiniteScroll(e: InfiniteScrollCustomEvent) {
		this.visibleCount.update((count) => count + PAGE_SIZE);
		e.target.complete();
	}

	async openPhoto(photo: SDK.PhotoResponseWithLinks) {
		await this.modalService.modal(
			PhotosEditComponent,
			{ photos: this.allPhotos(), startPhoto: photo },
			{ backdropDismiss: false, cssClass: "ion-modal-lg" },
		);
	}
}
