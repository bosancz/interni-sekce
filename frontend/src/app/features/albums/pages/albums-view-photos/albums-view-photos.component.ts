import { Component, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { IonButton, IonIcon, ModalController, ViewWillLeave } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ApiService } from "src/app/core/services/api.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { PhotosEditComponent } from "src/app/features/albums/components/photos-edit/photos-edit.component";
import { PhotosUploadComponent } from "src/app/features/albums/components/photos-upload/photos-upload.component";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";
import { AlbumsTabsComponent } from "../../components/albums-tabs/albums-tabs.component";
import { PhotoListComponent } from "../../components/photo-list/photo-list.component";

@UntilDestroy()
@Component({
	selector: "bo-albums-view-photos",
	templateUrl: "./albums-view-photos.component.html",
	styleUrls: ["./albums-view-photos.component.scss"],

	imports: [PageHeaderComponent, PageContentComponent, PhotoListComponent, AlbumsTabsComponent, IonButton, IonIcon],
})
export class AlbumsViewPhotosComponent implements OnInit, ViewWillLeave {
	album = signal<SDK.AlbumResponseWithLinks | undefined>(undefined);

	photos = signal<SDK.PhotoResponseWithLinks[] | undefined>(undefined);

	actions = signal<Action[]>([]);

	photosView = signal<"list" | "grid">("list");

	enableOrdering = signal(false);
	enableDeleting = signal(false);

	oldOrder = signal<SDK.PhotoResponseWithLinks[] | undefined>(undefined);

	showCheckboxes = signal(false);
	selectedPhotos = signal<SDK.PhotoResponseWithLinks[]>([]);

	photosModal?: HTMLIonModalElement;
	uploadModal?: HTMLIonModalElement;

	constructor(
		private api: ApiService,
		public platformService: PlatformService,
		public modalController: ModalController,
		private toastService: ToastService,
		private route: ActivatedRoute,
		private router: Router,
	) {}

	ngOnInit(): void {
		this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
			if (this.album()?.id !== params["album"]) this.loadPhotos(params["album"]);
		});

		this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => {
			if (params.photo && !this.photosModal) {
				const photo = this.photos()?.find((item) => item.id);
				if (photo) this.openPhoto(photo);
			}
			if (!params.photo && this.photosModal) {
				this.photosModal.dismiss();
			}
		});
	}

	ionViewWillLeave() {
		this.photosModal?.dismiss();
		this.uploadModal?.dismiss();
	}

	async loadPhotos(albumId: number) {
		const album = await this.api.PhotoGalleryApi.getAlbum(albumId).then((res) => res.data);
		this.album.set(album);
		this.actions.set(this.getActions(album));

		const photos = await this.api.PhotoGalleryApi.getAlbumPhotos(albumId).then((res) => res.data);
		this.photos.set(photos);

		if (this.route.snapshot.queryParams["photo"] && !this.photosModal) {
			const photo = photos?.find((item) => item.id);
			if (photo) this.openPhoto(photo);
		}
	}

	private async saveAlbum() {}

	onPhotoClick(event: CustomEvent<SDK.PhotoResponseWithLinks | undefined>) {
		if (this.enableDeleting() || this.enableOrdering()) return;

		if (!event.detail) return;

		this.router.navigate([], { queryParams: { photo: event.detail.id } });
	}

	async openPhoto(photo: SDK.PhotoResponseWithLinks) {
		if (this.photosModal) this.photosModal.dismiss();

		const photos = this.photos();
		const originalCount = photos?.length;

		this.photosModal = await this.modalController.create({
			component: PhotosEditComponent,
			componentProps: {
				photos: photos,
			},
			backdropDismiss: false,
			cssClass: "ion-modal-lg",
		});

		this.photosModal.onWillDismiss().then(() => {
			this.photosModal = undefined;

			const album = this.album();
			const photos = this.photos();
			if (photos?.length !== originalCount && album) {
				this.loadPhotos(album.id); // album must be present when closing modal
			}
		});

		this.photosModal.present();
	}

	orderByDate() {
		const photos = this.photos();
		if (photos) {
			const sorted = [...photos].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
			this.photos.set(sorted);
		}
	}

	orderByName() {
		const photos = this.photos();
		if (photos) {
			const sorted = [...photos].sort((a, b) => a.name.localeCompare(b.name));
			this.photos.set(sorted);
		}
	}

	startOrdering() {
		this.enableOrdering.set(true);
		this.photosView.set("list");
		const photos = this.photos();
		this.oldOrder.set(photos ? [...photos] : undefined);
		this.actions.set([
			{
				text: "Uložit",
				color: "primary",
				pinned: true,
				handler: () => this.saveOrdering().then(() => this.endOrdering()),
			},
			{ text: "Podle data", handler: () => this.orderByDate() },
			{ text: "Podle jména", handler: () => this.orderByName() },
			{
				text: "Zrušit",
				hidden: this.platformService.isIos.value,
				handler: () => this.endOrdering(),
			},
		]);
	}

	endOrdering() {
		const oldOrder = this.oldOrder();
		if (oldOrder) {
			this.photos.set([...oldOrder]);
			this.oldOrder.set(undefined);
		}
		const album = this.album();
		if (album) {
			this.actions.set(this.getActions(album));
		}
		this.enableOrdering.set(false);
	}

	startDeleting() {
		this.startSelecting();
		this.enableDeleting.set(true);
		this.actions.set([
			{
				text: "Smazat",
				role: "destructive",
				color: "danger",
				pinned: true,
				handler: () => this.deletePhotos().then(() => this.endDeleting()),
			},
			{
				text: "Zrušit",
				hidden: this.platformService.isIos.value,
				handler: () => this.endDeleting(),
			},
		]);
	}

	endDeleting() {
		this.enableDeleting.set(false);
		this.stopSelecting();
		const album = this.album();
		if (album) {
			this.actions.set(this.getActions(album));
		}
	}

	private startSelecting() {
		this.showCheckboxes.set(true);
		this.selectedPhotos.set([]);
	}

	private stopSelecting() {
		this.showCheckboxes.set(false);
		this.selectedPhotos.set([]);
	}

	private async deletePhotos() {
		const toast = await this.toastService.toast("Mažu fotky...");

		const selected = this.selectedPhotos();
		for (let photo of selected) {
			await this.api.PhotoGalleryApi.deletePhoto(photo.id);
		}

		const album = this.album();
		if (album) {
			await this.loadPhotos(album.id); // wouldnt be able to delete photos if no album was present
		}

		toast.dismiss();
		this.toastService.toast("Fotky smazány");
	}

	private async uploadPhotos() {
		if (this.uploadModal) this.uploadModal.dismiss();

		const album = this.album();
		if (!album) return;

		this.uploadModal = await this.modalController.create({
			component: PhotosUploadComponent,
			componentProps: {
				album: album,
			},
			backdropDismiss: false,
		});

		this.uploadModal.onDidDismiss().then((event) => {
			if (event.data && album) {
				this.loadPhotos(album.id);
			}
		});

		this.uploadModal.present();
	}

	private async saveOrdering() {
		const album = this.album();
		const photos = this.photos();
		if (!album || !photos) return;

		// TODO: vymyslet jak se bude ukládat řazení fotek!!!

		// const data: Pick<AlbumResponseWithLinks, "photos"> = {
		//   photos: this.photos.map((photo) => photo.id),
		// };

		// await this.albumsService.updateAlbum(this.album.id, data);

		// await this.loadPhotos(this.album.id);

		// this.oldOrder = undefined;

		// this.toastService.toast("Uloženo.");
	}

	private getActions(album: SDK.AlbumResponseWithLinks): Action[] {
		return [
			{
				text: "Seřadit",
				icon: "swap-vertical-outline",
				handler: () => this.startOrdering(),
			},
			{
				text: "Nahrát",
				pinned: true,
				icon: "cloud-upload-outline",
				handler: () => this.uploadPhotos(),
			},
			{
				text: "Smazat",
				color: "danger",
				role: "destructive",
				icon: "trash-outline",
				handler: () => this.startDeleting(),
			},
		];
	}
}
