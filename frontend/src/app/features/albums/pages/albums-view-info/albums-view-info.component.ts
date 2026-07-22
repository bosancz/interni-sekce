import { Component, computed, OnInit, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertController, IonButton, IonIcon, ViewWillLeave } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import {
	calendarOutline,
	closeOutline,
	cloudUploadOutline,
	createOutline,
	eyeOffOutline,
	eyeOutline,
	openOutline,
	save,
	swapVerticalOutline,
	textOutline,
	trash,
	trashOutline,
} from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";
import { AlbumGalleryComponent } from "../../components/album-gallery/album-gallery.component";
import { AlbumInfoComponent } from "../../components/album-info/album-info.component";
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
		AlbumInfoComponent,
		AlbumGalleryComponent,
		IonButton,
		IonIcon,
	],
})
export class AlbumsViewInfoComponent implements OnInit, ViewWillLeave {
	album = signal<SDK.AlbumResponseWithLinks | undefined>(undefined);

	photos = signal<SDK.PhotoResponseWithLinks[] | undefined>(undefined);

	photosView = signal<"gallery" | "manage">("gallery");

	selecting = signal(false);

	selectedPhotos = signal<SDK.PhotoResponseWithLinks[]>([]);

	private isDesktop = toSignal(this.platformService.isLg, { initialValue: this.platformService.isLg.value });

	headerActions = computed<Action[]>(() => {
		const album = this.album();
		if (!album) return [];
		// on desktop the gallery controls live inline above the gallery; on mobile
		// they are folded into the header actions menu alongside the album actions
		if (this.isDesktop()) return this.getAlbumActions(album);
		return [...this.getAlbumActions(album), ...this.getGalleryActions()];
	});

	alert?: HTMLIonAlertElement;
	photosModal?: HTMLIonModalElement;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private api: ApiService,
		private toastService: ToastService,
		private alertController: AlertController,
		private modalService: ModalService,
		public platformService: PlatformService,
	) {
		addIcons({
			cloudUploadOutline,
			openOutline,
			eyeOutline,
			eyeOffOutline,
			trash,
			trashOutline,
			createOutline,
			save,
			swapVerticalOutline,
			closeOutline,
			calendarOutline,
			textOutline,
		});
	}

	ngOnInit(): void {
		this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
			if (this.album()?.id !== params["album"]) this.loadAlbum(params["album"]);
		});
	}

	ionViewWillLeave() {
		this.alert?.dismiss();
		this.photosModal?.dismiss();
	}

	async updateAlbum(data: SDK.AlbumUpdateBody) {
		const album = this.album();
		if (!album) return;

		try {
			await this.api.PhotoGalleryApi.updateAlbum(album.id, data);
			this.toastService.toast("Uloženo.");
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit změny.", { color: "warning" });
		}

		await this.loadAlbum(album.id);
	}

	async loadAlbum(albumId: number) {
		const album = await this.api.PhotoGalleryApi.getAlbum(albumId).then((res) => res.data);
		this.album.set(album);

		const photos = await this.api.PhotoGalleryApi.getAlbumPhotos(albumId).then((res) => res.data);
		this.photos.set(photos);

		const photoId = this.route.snapshot.queryParams["photo"];
		if (photoId && !this.photosModal) {
			const photo = photos?.find((item) => String(item.id) === String(photoId));
			if (photo) this.openPhoto(photo);
		}
	}

	onGalleryClick(photo: SDK.PhotoResponseWithLinks) {
		this.openPhoto(photo);
	}

	onListClick(event: CustomEvent<SDK.PhotoResponseWithLinks | undefined>) {
		if (this.selecting()) return;
		if (!event.detail) return;
		this.openPhoto(event.detail);
	}

	async openPhoto(photo: SDK.PhotoResponseWithLinks) {
		if (this.photosModal) return;

		const photos = this.photos();
		const originalCount = photos?.length;

		// reflect the open photo in the URL for deep-linking, without adding a
		// history entry — back-to-close is provided by ModalService
		this.router.navigate([], {
			queryParams: { photo: photo.id },
			queryParamsHandling: "merge",
			replaceUrl: true,
		});

		this.photosModal = await this.modalService.modal(
			PhotosEditComponent,
			{ photos },
			{ backdropDismiss: false, cssClass: "ion-modal-lg" },
		);

		this.photosModal.onWillDismiss().then(() => {
			this.photosModal = undefined;

			const album = this.album();
			const photos = this.photos();
			if (photos?.length !== originalCount && album) {
				this.loadAlbum(album.id); // album must be present when closing modal
			}
		});
	}

	// --- Ordering -----------------------------------------------------------

	async onReorder(photos: SDK.PhotoResponseWithLinks[]) {
		this.photos.set(photos);
		await this.persistOrder(photos);
	}

	async sortByDate() {
		const photos = [...(this.photos() ?? [])].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
		this.photos.set(photos);
		await this.persistOrder(photos);
	}

	async sortByName() {
		const photos = [...(this.photos() ?? [])].sort((a, b) => a.name.localeCompare(b.name));
		this.photos.set(photos);
		await this.persistOrder(photos);
	}

	private async persistOrder(photos: SDK.PhotoResponseWithLinks[]) {
		const album = this.album();
		if (!album) return;

		try {
			await this.api.PhotoGalleryApi.reorderAlbumPhotos(album.id, { photoIds: photos.map((photo) => photo.id) });
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit pořadí fotek.", { color: "warning" });
			await this.loadAlbum(album.id);
		}
	}

	// --- Selecting & deleting -------------------------------------------------

	startSelecting() {
		this.selecting.set(true);
		this.selectedPhotos.set([]);
	}

	cancelSelecting() {
		this.selecting.set(false);
		this.selectedPhotos.set([]);
	}

	onLongPress(photo: SDK.PhotoResponseWithLinks) {
		if (this.selecting()) return;
		this.selecting.set(true);
		this.selectedPhotos.set([photo]);
	}

	async deleteSelected() {
		const selected = this.selectedPhotos();
		if (!selected.length) return;

		this.alert = await this.alertController.create({
			message: `Opravdu chcete smazat vybrané fotky (${selected.length})?`,
			buttons: [
				{ text: "Zrušit", role: "cancel" },
				{ text: "Smazat", handler: () => this.deleteSelectedConfirmed() },
			],
		});

		this.alert.present();
	}

	private async deleteSelectedConfirmed() {
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
		this.cancelSelecting();
	}

	// --- Album actions ------------------------------------------------------

	async uploadPhotos() {
		const album = this.album();
		if (!album) return;

		const uploaded = await this.modalService.componentModal(
			PhotosUploadComponent,
			{ album },
			{ backdropDismiss: false, cssClass: "dialog-list" },
		);

		if (uploaded) this.loadAlbum(album.id);
	}

	private async publish() {
		const album = this.album();
		if (!album?._links.publishAlbum.allowed) return;
		await this.api.PhotoGalleryApi.publishAlbum(album.id);
		await this.loadAlbum(album.id);
		this.toastService.toast("Publikováno.");
	}

	private async unpublish() {
		const album = this.album();
		if (!album?._links.unpublishAlbum.allowed) return;
		await this.api.PhotoGalleryApi.unpublishAlbum(album.id);
		await this.loadAlbum(album.id);
		this.toastService.toast("Publikace zrušena.");
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

	private getAlbumActions(album: SDK.AlbumResponseWithLinks): Action[] {
		return [
			{
				text: "Publikovat",
				icon: "eye-outline",
				hidden: album.status !== "draft",
				handler: () => this.publish(),
			},
			{
				text: "Otevřít na webu",
				icon: "open-outline",
				color: "success",
				hidden: album.status !== "public",
				handler: () => this.open(),
			},
			{
				text: "Zrušit publikaci",
				icon: "eye-off-outline",
				hidden: album.status !== "public",
				handler: () => this.unpublish(),
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

	// photo edit options shown in the header on mobile instead of the inline buttons row
	private getGalleryActions(): Action[] {
		const manage = this.photosView() === "manage";

		return [
			{
				text: "Nahrát fotky",
				icon: "cloud-upload-outline",
				// the empty state shows its own upload button
				hidden: !this.photos()?.length,
				handler: () => this.uploadPhotos(),
			},
			{
				text: "Upravit",
				icon: "create-outline",
				hidden: manage || !this.photos()?.length,
				handler: () => this.photosView.set("manage"),
			},
			{
				text: "Prohlížet",
				icon: "eye-outline",
				hidden: !manage,
				handler: () => {
					this.photosView.set("gallery");
					this.cancelSelecting();
				},
			},
			{
				text: "Podle data",
				icon: "calendar-outline",
				hidden: !manage,
				handler: () => this.sortByDate(),
			},
			{
				text: "Podle jména",
				icon: "text-outline",
				hidden: !manage,
				handler: () => this.sortByName(),
			},
		];
	}
}
