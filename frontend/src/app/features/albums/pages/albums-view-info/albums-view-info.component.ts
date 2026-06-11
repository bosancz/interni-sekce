import { DatePipe } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
	AlertController,
	IonButton,
	IonIcon,
	ModalController,
	ViewWillLeave,
} from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import {
	cloudUploadOutline,
	createOutline,
	eyeOffOutline,
	eyeOutline,
	imagesOutline,
	listOutline,
	openOutline,
	swapVerticalOutline,
	trash,
	trashOutline,
} from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { PhotoGalleryComponent } from "src/app/shared/components/photo-gallery/photo-gallery.component";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { SDK } from "src/sdk";
import { PhotoListComponent } from "../../components/photo-list/photo-list.component";
import { PhotosEditComponent } from "../../components/photos-edit/photos-edit.component";
import { PhotosUploadComponent } from "../../components/photos-upload/photos-upload.component";

@UntilDestroy()
@Component({
	selector: "bo-albums-view-info",
	templateUrl: "./albums-view-info.component.html",
	styleUrls: ["./albums-view-info.component.scss"],

	imports: [
		PageHeaderComponent,
		PageContentComponent,
		PhotoGalleryComponent,
		PhotoListComponent,
		IonButton,
		IonIcon,
		DatePipe,
		DateRangePipe,
	],
})
export class AlbumsViewInfoComponent implements OnInit, ViewWillLeave {
	album = signal<SDK.AlbumResponseWithLinks | undefined>(undefined);

	photos = signal<SDK.PhotoResponseWithLinks[] | undefined>(undefined);

	actions = signal<Action[]>([]);

	photosView = signal<"gallery" | "list">("gallery");

	enableOrdering = signal(false);
	enableDeleting = signal(false);

	oldOrder = signal<SDK.PhotoResponseWithLinks[] | undefined>(undefined);

	selectedPhotos = signal<SDK.PhotoResponseWithLinks[]>([]);

	alert?: HTMLIonAlertElement;
	uploadModal?: HTMLIonModalElement;
	photosModal?: HTMLIonModalElement;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private api: ApiService,
		private toastService: ToastService,
		private alertController: AlertController,
		private modalController: ModalController,
		public platformService: PlatformService,
	) {
		addIcons({
			cloudUploadOutline,
			createOutline,
			openOutline,
			eyeOutline,
			eyeOffOutline,
			trash,
			trashOutline,
			swapVerticalOutline,
			listOutline,
			imagesOutline,
		});
	}

	ngOnInit(): void {
		this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
			if (this.album()?.id !== params["album"]) this.loadAlbum(params["album"]);
		});

		this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => {
			if (params.photo && !this.photosModal) {
				const photo = this.photos()?.find((item) => String(item.id) === String(params.photo));
				if (photo) this.openPhoto(photo);
			}
			if (!params.photo && this.photosModal) {
				this.photosModal.dismiss();
			}
		});
	}

	ionViewWillLeave() {
		this.alert?.dismiss();
		this.uploadModal?.dismiss();
		this.photosModal?.dismiss();
	}

	async loadAlbum(albumId: number) {
		const album = await this.api.PhotoGalleryApi.getAlbum(albumId).then((res) => res.data);
		this.album.set(album);
		this.actions.set(this.getActions(album));

		const photos = await this.api.PhotoGalleryApi.getAlbumPhotos(albumId).then((res) => res.data);
		this.photos.set(photos);

		const photoId = this.route.snapshot.queryParams["photo"];
		if (photoId && !this.photosModal) {
			const photo = photos?.find((item) => String(item.id) === String(photoId));
			if (photo) this.openPhoto(photo);
		}
	}

	onGalleryClick(photo: SDK.PhotoResponseWithLinks) {
		if (this.enableDeleting() || this.enableOrdering()) return;
		this.router.navigate([], { queryParams: { photo: photo.id } });
	}

	onListClick(event: CustomEvent<SDK.PhotoResponseWithLinks | undefined>) {
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
				this.loadAlbum(album.id); // album must be present when closing modal
			}
		});

		this.photosModal.present();
	}

	// --- Ordering -----------------------------------------------------------

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

	private async saveOrdering() {
		const album = this.album();
		const photos = this.photos();
		if (!album || !photos) return;

		// TODO: vymyslet jak se bude ukládat řazení fotek!!!
	}

	// --- Deleting -----------------------------------------------------------

	startDeleting() {
		this.enableDeleting.set(true);
		this.photosView.set("list");
		this.selectedPhotos.set([]);
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
		this.selectedPhotos.set([]);
		const album = this.album();
		if (album) {
			this.actions.set(this.getActions(album));
		}
	}

	private async deletePhotos() {
		const toast = await this.toastService.toast("Mažu fotky...");

		const selected = this.selectedPhotos();
		for (let photo of selected) {
			await this.api.PhotoGalleryApi.deletePhoto(photo.id);
		}

		const album = this.album();
		if (album) {
			await this.loadAlbum(album.id); // wouldnt be able to delete photos if no album was present
		}

		toast.dismiss();
		this.toastService.toast("Fotky smazány");
	}

	// --- Album actions ------------------------------------------------------

	private async uploadPhotos() {
		const album = this.album();
		if (!album) return;

		if (this.uploadModal) this.uploadModal.dismiss();

		this.uploadModal = await this.modalController.create({
			component: PhotosUploadComponent,
			componentProps: { album },
			backdropDismiss: false,
		});

		this.uploadModal.onDidDismiss().then((event) => {
			if (event.data) this.loadAlbum(album.id);
		});

		this.uploadModal.present();
	}

	private async publish() {
		const album = this.album();
		if (!album?._links.unpublishAlbum.allowed) return;
		await this.api.PhotoGalleryApi.unpublishAlbum(album.id);
		await this.loadAlbum(album.id);
		this.toastService.toast("Publikováno.");
	}

	private async unpublish() {
		const album = this.album();
		if (!album?._links.publishAlbum.allowed) return;
		await this.api.PhotoGalleryApi.publishAlbum(album.id);
		await this.loadAlbum(album.id);
		this.toastService.toast("Publikováno.");
	}

	private async delete() {
		const album = this.album();
		this.alert = await this.alertController.create({
			message: `Opravdu chcete smazat album ${album?.name}?`,
			buttons: [
				{ text: "Zrušit", role: "cancel" },
				{ text: "Smazat", handler: () => this.deleteConfirmed() },
			],
		});

		this.alert.present();
	}

	private async deleteConfirmed() {
		const album = this.album();
		if (!album) return;

		await this.api.PhotoGalleryApi.deleteAlbum(album.id);

		this.toastService.toast("Smazáno.");
		this.router.navigate(["/galerie"], { relativeTo: this.route, replaceUrl: true });
	}

	private open() {
		const album = this.album();
		if (!album) return;
		window.open("https://bosan.cz/fotogalerie/" + album.id);
	}

	private getActions(album: SDK.AlbumResponseWithLinks): Action[] {
		return [
			{
				text: "Nahrát fotky",
				icon: "cloud-upload-outline",
				pinned: true,
				handler: () => this.uploadPhotos(),
			},
			{
				text: "Seřadit",
				icon: "swap-vertical-outline",
				handler: () => this.startOrdering(),
			},
			{
				text: "Upravit",
				icon: "create-outline",
				handler: () => this.router.navigate(["../upravit"], { relativeTo: this.route }),
			},
			{
				text: "Otevřít na webu",
				icon: "open-outline",
				color: "success",
				hidden: album.status !== "public",
				handler: () => this.open(),
			},
			{
				text: "Publikovat",
				icon: "eye-outline",
				hidden: album.status !== "draft",
				handler: () => this.publish(),
			},
			{
				text: "Zrušit publikaci",
				icon: "eye-off-outline",
				hidden: album.status !== "public",
				handler: () => this.unpublish(),
			},
			{
				text: "Smazat fotky",
				icon: "trash-outline",
				color: "danger",
				handler: () => this.startDeleting(),
			},
			{
				text: "Smazat album",
				role: "destructive",
				icon: "trash",
				color: "danger",
				handler: () => this.delete(),
			},
		];
	}
}
