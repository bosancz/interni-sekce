import { Component, computed, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { IonButton, IonIcon, IonSpinner } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { imagesOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { TitleService } from "src/app/core/services/title.service";
import { ToastService } from "src/app/core/services/toast.service";
import { PhotosEditComponent } from "src/app/features/albums/components/photos-edit/photos-edit.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardOpenButtonComponent } from "src/app/shared/components/card-open-button/card-open-button.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { PhotoGalleryComponent } from "src/app/shared/components/photo-gallery/photo-gallery.component";
import { AlbumPhotos, groupPhotosByAlbum } from "src/helpers/album-photos";
import { SDK } from "src/sdk";

const PAGE_SIZE = 200;

@UntilDestroy()
@Component({
	selector: "bo-member-new-photos",
	templateUrl: "./member-new-photos.component.html",
	styleUrl: "./member-new-photos.component.scss",
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		CardOpenButtonComponent,
		PhotoGalleryComponent,
		RouterLink,
		IonButton,
		IonIcon,
		IonSpinner,
	],
})
export class MemberNewPhotosComponent {
	member = signal<SDK.MemberResponseWithLinks | undefined>(undefined);
	photos = signal<SDK.PhotoResponseWithLinks[] | undefined>(undefined);

	title = computed(() => {
		const member = this.member();
		return member ? `Nové fotky: ${member.nickname || member.firstName}` : "Nové fotky";
	});

	albums = computed(() => groupPhotosByAlbum(this.photos() ?? []));

	constructor(
		private api: ApiService,
		private route: ActivatedRoute,
		private modalService: ModalService,
		private titleService: TitleService,
		private toastService: ToastService,
	) {
		addIcons({ imagesOutline });

		this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
			this.load(parseInt(params["member"]), parseInt(params["notifiedAt"]));
		});
	}

	async load(memberId: number, notifiedAt: number) {
		this.member.set(undefined);
		this.photos.set(undefined);

		try {
			const member = await this.api.MembersApi.getMember(memberId).then((res) => res.data);
			this.member.set(member);
			this.titleService.setTitle(this.title());

			const photos: SDK.PhotoResponseWithLinks[] = [];
			while (true) {
				const page = await this.api.MembersApi.listMemberPhotos(memberId, {
					notifiedAt,
					limit: PAGE_SIZE,
					offset: photos.length,
				}).then((res) => res.data as unknown as SDK.PhotoResponseWithLinks[]);
				photos.push(...page);
				if (page.length < PAGE_SIZE) break;
			}
			this.photos.set(photos);
		} catch {
			this.photos.set([]);
			this.toastService.toast("Nepodařilo se načíst fotky.", { color: "warning" });
		}
	}

	async openPhoto(group: AlbumPhotos, photo: SDK.PhotoResponseWithLinks) {
		await this.modalService.modal(
			PhotosEditComponent,
			{ photos: [...group.photos], startPhoto: photo },
			{ backdropDismiss: false, cssClass: "ion-modal-lg" },
		);
	}
}
