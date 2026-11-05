import { DatePipe } from "@angular/common";
import { Component, computed, effect, input, output, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonButton, IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
	addOutline,
	closeOutline,
	createOutline,
	documentAttachOutline,
	globeOutline,
	imagesOutline,
	linkOutline,
} from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { MarkdownPipe } from "src/app/shared/pipes/markdown.pipe";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { PrettyBytesPipe } from "src/app/shared/pipes/pretty-bytes.pipe";
import { openPdf } from "src/helpers/open-pdf";
import { SDK } from "src/sdk";
import { AlbumSelectorModalComponent } from "../album-selector-modal/album-selector-modal.component";

const PREVIEW_PHOTOS = 12;

@Component({
	selector: "bo-event-gallery",
	templateUrl: "./event-gallery.component.html",
	styleUrl: "./event-gallery.component.scss",
	imports: [
		DatePipe,
		RouterLink,
		CardComponent,
		CardContentComponent,
		CardHeaderComponent,
		CardTitleComponent,
		DateRangePipe,
		MarkdownPipe,
		PhotoImageUrlPipe,
		PrettyBytesPipe,
		IonButton,
		IonIcon,
		IonSkeletonText,
		TooltipDirective,
	],
})
export class EventGalleryComponent {
	event = input<SDK.EventResponseWithLinks | undefined>();
	change = output<void>();

	readonly noPermissionText = "K této akci nemáš oprávnění.";

	album = signal<SDK.AlbumResponseWithLinks | null>(null);
	photos = signal<SDK.PhotoResponseWithLinks[] | null>(null);

	previewPhotos = computed(() => this.photos()?.slice(0, PREVIEW_PHOTOS) ?? []);
	morePhotos = computed(() => Math.max((this.photos()?.length ?? 0) - PREVIEW_PHOTOS, 0));

	canEditEvent = computed(() => this.event()?._links?.updateEvent?.allowed ?? false);

	busy = signal(false);

	constructor(
		private readonly api: ApiService,
		private readonly modalService: ModalService,
		private readonly toastService: ToastService,
	) {
		addIcons({
			addOutline,
			closeOutline,
			createOutline,
			documentAttachOutline,
			globeOutline,
			imagesOutline,
			linkOutline,
		});

		effect(() => {
			const albumId = this.event()?.album?.id;
			if (albumId) this.loadAlbum(albumId);
			else {
				this.album.set(null);
				this.photos.set(null);
			}
		});
	}

	private async loadAlbum(albumId: number) {
		const [album, photos] = await Promise.all([
			this.api.PhotoGalleryApi.getAlbum(albumId)
				.then((res) => res.data)
				.catch(() => null),
			this.api.PhotoGalleryApi.getAlbumPhotos(albumId)
				.then((res) => res.data)
				.catch(() => []),
		]);
		if (this.event()?.album?.id !== albumId) return;
		this.album.set(album);
		this.photos.set(photos);
	}

	async openChronicle() {
		const album = this.album();
		if (!album) return;

		const response = await this.api.PhotoGalleryApi.getAlbumChronicle(album.id, { responseType: "blob" }).catch(
			() => null,
		);
		if (!response) {
			this.toastService.toast("Nepodařilo se otevřít kroniku.", { color: "warning" });
			return;
		}

		openPdf(response.data as unknown as Blob);
	}

	async publish() {
		const album = this.album();
		if (!album || this.busy()) return;

		const confirmed = await this.modalService.confirmationModal(
			`Po publikování uvidí fotogalerii „${album.name}“ návštěvníci bosan.cz.`,
			{ header: "Publikovat fotogalerii?", buttonText: "Publikovat" },
		);
		if (!confirmed) return;

		this.busy.set(true);
		try {
			await this.api.PhotoGalleryApi.publishAlbum(album.id);
			this.toastService.toast("Fotogalerie publikována.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se publikovat fotogalerii.", { color: "warning" });
		} finally {
			this.busy.set(false);
		}
	}

	async linkAlbum() {
		const event = this.event();
		if (!event || this.busy()) return;

		const album = await this.modalService.componentModal(
			AlbumSelectorModalComponent,
			{ initialSearch: event.name, eventId: event.id },
			{ cssClass: "dialog-picker" },
		);
		if (!album) return;

		this.busy.set(true);
		try {
			await this.api.PhotoGalleryApi.updateAlbum(album.id, { eventId: event.id });
			this.toastService.toast("Album připojeno k akci.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se připojit album.", { color: "warning" });
		} finally {
			this.busy.set(false);
		}
	}

	async createAlbum() {
		const event = this.event();
		if (!event || this.busy()) return;

		this.busy.set(true);
		try {
			const album = await this.api.PhotoGalleryApi.createAlbum({
				name: event.name,
				dateFrom: event.dateFrom,
				dateTill: event.dateTill,
			}).then((res) => res.data);
			await this.api.PhotoGalleryApi.updateAlbum(album.id, { eventId: event.id });
			this.toastService.toast("Album vytvořeno a připojeno k akci.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se vytvořit album.", { color: "warning" });
		} finally {
			this.busy.set(false);
		}
	}

	async removeAlbum() {
		const album = this.album();
		if (!album || this.busy()) return;

		const confirmed = await this.modalService.deleteConfirmationModal(
			`Opravdu chcete odpojit album „${album.name}“ od této akce? Album zůstane zachováno.`,
			{ header: "Odpojit album?", buttonText: "Odpojit" },
		);
		if (!confirmed) return;

		this.busy.set(true);
		try {
			await this.api.PhotoGalleryApi.updateAlbum(album.id, { eventId: null });
			this.toastService.toast("Album odpojeno od akce.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se odpojit album.", { color: "warning" });
		} finally {
			this.busy.set(false);
		}
	}
}
