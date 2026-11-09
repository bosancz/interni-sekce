import { Component, computed, effect, input, output, signal, untracked } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonButton, IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { addOutline, checkmark, ellipsisVertical, imagesOutline, linkOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import {
	DropdownMenuComponent,
	DropdownMenuOption,
} from "src/app/shared/components/dropdown-menu/dropdown-menu.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { SDK } from "src/sdk";
import { AlbumSelectorModalComponent } from "../album-selector-modal/album-selector-modal.component";

interface AlbumCheck {
	label: string;
	done: boolean;
	note: string;
	warn: boolean;
}

@Component({
	selector: "bo-event-gallery",
	templateUrl: "./event-gallery.component.html",
	styleUrl: "./event-gallery.component.scss",
	imports: [
		CardComponent,
		CardContentComponent,
		DropdownMenuComponent,
		DateRangePipe,
		IonButton,
		IonIcon,
		IonSkeletonText,
		RouterLink,
		TooltipDirective,
	],
})
export class EventGalleryComponent {
	event = input<SDK.EventResponseWithLinks | undefined>();
	change = output<void>();

	readonly noPermissionText = "K této akci nemáš oprávnění.";

	readonly menuOptions: DropdownMenuOption<string>[] = [{ value: "unlink", label: "Odpojit album od akce" }];

	album = signal<SDK.AlbumResponseWithLinks | undefined>(undefined);

	photos = signal<SDK.PhotoResponseWithLinks[] | undefined>(undefined);

	canEditEvent = computed(() => this.event()?._links?.updateEvent?.allowed ?? false);

	checks = computed<AlbumCheck[]>(() => {
		const album = this.album();
		const photos = this.photos() ?? [];
		if (!album) return [];

		const description = !!album.description?.trim();
		const chronicle = !!album.chronicleFileName;
		const titlePhoto = photos.some((photo) => photo.titlePhoto);

		return [
			{
				label: "Popisek nebo kronika",
				done: description || chronicle,
				note:
					description && chronicle
						? "popisek i kronika v PDF"
						: description
							? "popisek"
							: chronicle
								? "kronika v PDF"
								: "chybí",
				warn: true,
			},
			{
				label: "Titulní fotka",
				done: titlePhoto,
				note: titlePhoto ? "vybraná" : photos.length ? "nevybraná, na webu bude první fotka" : "nevybraná",
				warn: true,
			},
			{
				label: "Fotky",
				done: photos.length > 0,
				note: photos.length ? String(photos.length) : "zatím žádné",
				warn: true,
			},
		];
	});

	busy = signal(false);

	constructor(
		private readonly api: ApiService,
		private readonly modalService: ModalService,
		private readonly toastService: ToastService,
	) {
		addIcons({ addOutline, checkmark, ellipsisVertical, imagesOutline, linkOutline });

		effect(() => {
			const albumId = this.event()?.album?.id;
			untracked(() => this.loadAlbum(albumId));
		});
	}

	private async loadAlbum(albumId: number | undefined) {
		if (!albumId) {
			this.album.set(undefined);
			this.photos.set(undefined);
			return;
		}

		const [album, photos] = await Promise.all([
			this.api.PhotoGalleryApi.getAlbum(albumId).then((res) => res.data),
			this.api.PhotoGalleryApi.getAlbumPhotos(albumId).then((res) => res.data),
		]);
		if (this.event()?.album?.id !== albumId) return;
		this.album.set(album);
		this.photos.set(photos);
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
		const album = this.album() ?? this.event()?.album;
		if (!album || this.busy()) return;

		const confirmed = await this.modalService.deleteConfirmationModal(
			`Opravdu chceš odpojit album „${album.name}“ od této akce? Album zůstane zachováno.`,
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
