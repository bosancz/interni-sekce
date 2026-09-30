import { Component, effect, input, signal } from "@angular/core";
import { IonButton, IonIcon, IonSpinner } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { imagesOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { PhotosEditComponent } from "src/app/features/albums/components/photos-edit/photos-edit.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { PhotoGalleryComponent } from "src/app/shared/components/photo-gallery/photo-gallery.component";
import { SDK } from "src/sdk";

const PAGE_SIZE = 30;

@Component({
	selector: "bo-member-photos",
	templateUrl: "./member-photos.component.html",
	styleUrl: "./member-photos.component.scss",
	imports: [
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		PhotoGalleryComponent,
		IonButton,
		IonIcon,
		IonSpinner,
	],
})
export class MemberPhotosComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();

	photos = signal<SDK.PhotoResponseWithLinks[]>([]);
	loading = signal(false);
	hasMore = signal(false);

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
			if (member._links.listMemberPhotos.allowed) this.loadMore();
		});
	}

	async loadMore() {
		const member = this.member();
		if (!member || this.loading()) return;

		this.loading.set(true);

		try {
			const page = await this.api.MembersApi.listMemberPhotos(member.id, {
				limit: PAGE_SIZE,
				offset: this.photos().length,
			}).then((res) => res.data as unknown as SDK.PhotoResponseWithLinks[]);

			if (this.member()?.id !== member.id) return;

			this.photos.update((photos) => [...photos, ...page]);
			this.hasMore.set(page.length === PAGE_SIZE);
		} catch {
			this.toastService.toast("Nepodařilo se načíst fotky.", { color: "warning" });
		} finally {
			this.loading.set(false);
		}
	}

	async openPhoto(photo: SDK.PhotoResponseWithLinks) {
		await this.modalService.modal(
			PhotosEditComponent,
			{ photos: [...this.photos()], startPhoto: photo },
			{ backdropDismiss: false, cssClass: "ion-modal-lg" },
		);
	}
}
