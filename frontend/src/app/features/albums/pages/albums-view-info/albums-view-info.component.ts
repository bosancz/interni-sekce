import { Component, computed, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ActionSheetController, AlertController, ViewWillLeave } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { calendarOutline, eyeOffOutline, eyeOutline, openOutline, textOutline, trash } from "ionicons/icons";
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

	imports: [PageHeaderComponent, PageContentComponent, AlbumInfoComponent, AlbumGalleryComponent],
})
export class AlbumsViewInfoComponent implements OnInit, ViewWillLeave {
	album = signal<SDK.AlbumResponseWithLinks | undefined>(undefined);

	photos = signal<SDK.PhotoResponseWithLinks[] | undefined>(undefined);

	photosView = signal<"gallery" | "manage">("gallery");

	selecting = signal(false);

	selectedPhotos = signal<SDK.PhotoResponseWithLinks[]>([]);

	// the gallery controls live inline next to the Galerie heading on every size,
	// so the header menu only ever holds the album actions
	headerActions = computed<Action[]>(() => {
		const album = this.album();
		if (!album) return [];
		return this.getAlbumActions(album);
	});

	alert?: HTMLIonAlertElement;
	photosModal?: HTMLIonModalElement;
	sortSheet?: HTMLIonActionSheetElement;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private api: ApiService,
		private toastService: ToastService,
		private alertController: AlertController,
		private actionSheetController: ActionSheetController,
		private modalService: ModalService,
		private platformService: PlatformService,
	) {
		addIcons({
			openOutline,
			eyeOutline,
			eyeOffOutline,
			trash,
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
		this.sortSheet?.dismiss();
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

	// picking an option is itself the confirmation that the custom order can go
	async sortPhotos() {
		const options = [
			{
				value: "date",
				text: "Podle data",
				icon: "calendar-outline",
				compare: (a: SDK.PhotoResponseWithLinks, b: SDK.PhotoResponseWithLinks) =>
					a.timestamp.localeCompare(b.timestamp),
			},
			{
				value: "name",
				text: "Podle jména",
				icon: "text-outline",
				compare: (a: SDK.PhotoResponseWithLinks, b: SDK.PhotoResponseWithLinks) => a.name.localeCompare(b.name),
			},
		];

		// the action sheet slides up from the bottom edge, which only reads well on a phone
		if (this.platformService.isLg.value) {
			this.alert = await this.alertController.create({
				header: "Seřadit fotky",
				message: "Vlastní pořadí fotek se ztratí.",
				inputs: options.map((option, index) => ({
					type: "radio" as const,
					label: option.text,
					value: option.value,
					checked: index === 0,
				})),
				buttons: [
					{ text: "Zrušit", role: "cancel" },
					{
						text: "Seřadit",
						handler: (value: string) => {
							const option = options.find((item) => item.value === value);
							if (option) this.applySort(option.compare);
						},
					},
				],
			});

			this.alert.present();
			return;
		}

		this.sortSheet = await this.actionSheetController.create({
			header: "Seřadit fotky",
			subHeader: "Vlastní pořadí fotek se ztratí.",
			buttons: [
				...options.map((option) => ({
					text: option.text,
					icon: option.icon,
					handler: () => this.applySort(option.compare),
				})),
				{ text: "Zrušit", role: "cancel" },
			],
		});

		this.sortSheet.present();
	}

	private async applySort(compare: (a: SDK.PhotoResponseWithLinks, b: SDK.PhotoResponseWithLinks) => number) {
		const photos = [...(this.photos() ?? [])].sort(compare);
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
		// actions that do not apply to the album in its current state are hidden,
		// actions that apply but the user is not permitted to use are shown disabled
		return [
			{
				text: "Publikovat",
				icon: "eye-outline",
				hidden: !album._links.publishAlbum.applicable,
				disabled: !album._links.publishAlbum.allowed,
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
				hidden: !album._links.unpublishAlbum.applicable,
				disabled: !album._links.unpublishAlbum.allowed,
				handler: () => this.unpublish(),
			},
			{
				text: "Smazat album",
				role: "destructive",
				icon: "trash",
				color: "danger",
				hidden: !album._links.deleteAlbum.applicable,
				disabled: !album._links.deleteAlbum.allowed,
				handler: () => this.delete(),
			},
		];
	}
}
