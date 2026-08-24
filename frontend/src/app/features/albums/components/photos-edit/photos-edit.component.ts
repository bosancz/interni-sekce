import { DatePipe } from "@angular/common";
import { Component, HostListener, Input, OnInit, signal, ViewChild } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import {
	AlertController,
	IonButton,
	IonButtons,
	IonContent,
	IonIcon,
	IonInput,
	IonInput as IonInputStandalone,
	IonItem,
	IonLabel,
	IonList,
	IonPopover,
	IonToolbar,
	ModalController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
	checkmarkOutline,
	chevronBackOutline,
	chevronForwardOutline,
	createOutline,
	imageOutline,
	star,
	starOutline,
} from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { SDK } from "src/sdk";
import { PhotoTagsEditorComponent } from "../photo-tags-editor/photo-tags-editor.component";

@Component({
	selector: "bo-photos-edit",
	templateUrl: "./photos-edit.component.html",
	styleUrls: ["./photos-edit.component.scss"],

	imports: [
		FormsModule,
		DatePipe,
		IonContent,
		IonToolbar,
		IonButtons,
		IonButton,
		IonPopover,
		IonList,
		IonItem,
		IonLabel,
		IonInputStandalone,
		IonIcon,
		PhotoImageUrlPipe,
		TooltipDirective,
		PhotoTagsEditorComponent,
	],
})
export class PhotosEditComponent implements OnInit {
	photo = signal<SDK.PhotoResponseWithLinks | undefined>(undefined);
	@Input() photos!: SDK.PhotoResponseWithLinks[];
	@Input() startPhoto?: SDK.PhotoResponseWithLinks;

	albumTags = signal<string[]>([]);

	imageError = signal(false);

	editingCaption = signal(false);

	infoOpen = signal(false);

	currentIndex = signal(0);

	controlsVisible = signal(true);

	isLg = toSignal(this.platformService.isLg, { initialValue: this.platformService.isLg.value });

	private swipeStart?: { x: number; y: number };

	@ViewChild("captionInput") captionInput!: IonInput;

	constructor(
		private modalController: ModalController,
		private api: ApiService,
		private toastService: ToastService,
		private alertController: AlertController,
		private router: Router,
		private platformService: PlatformService,
	) {
		addIcons({
			createOutline,
			checkmarkOutline,
			chevronBackOutline,
			chevronForwardOutline,
			imageOutline,
			star,
			starOutline,
		});
	}

	ngOnInit(): void {
		this.rebuildAlbumTags();

		let index = this.photos.findIndex((item) => item.id === this.startPhoto?.id);
		if (index === -1) index = 0;

		this.openPhoto(index);
	}

	private rebuildAlbumTags() {
		const seen = new Set<string>();
		for (const photo of this.photos) {
			for (const tag of photo.tags ?? []) seen.add(tag);
		}
		this.albumTags.set([...seen]);
	}

	@HostListener("document:keyup", ["$event"])
	onKeyUp(event: KeyboardEvent) {
		if (!this.editingCaption() && !this.infoOpen()) {
			switch (event.code) {
				case "ArrowLeft":
					return this.previousPhoto();
				case "ArrowRight":
					return this.nextPhoto();
				case "Escape":
					return this.close();
				case "Home":
					return this.openPhoto(0);
				case "End":
					return this.openPhoto(this.photos.length - 1);
				case "Enter":
					return this.editCaption();
			}
		} else {
			switch (event.code) {
				case "Escape":
					return this.cancelEditingCaption();
			}
		}
	}

	nextPhoto() {
		this.openPhoto(this.currentIndex() + 1);
	}

	previousPhoto() {
		this.openPhoto(this.currentIndex() - 1);
	}

	onPointerDown(event: PointerEvent) {
		if (event.pointerType !== "touch") return;
		this.swipeStart = { x: event.clientX, y: event.clientY };
	}

	onPointerUp(event: PointerEvent) {
		if (!this.swipeStart) return;
		const dx = event.clientX - this.swipeStart.x;
		const dy = event.clientY - this.swipeStart.y;
		this.swipeStart = undefined;

		if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy)) {
			if (dx < 0) this.nextPhoto();
			else this.previousPhoto();
			return;
		}

		if (Math.abs(dy) >= 50) return;

		if (!this.editingCaption()) this.controlsVisible.update((visible) => !visible);
	}

	openPhoto(index: number) {
		const photos = this.photos;
		if (index < 0 || index >= photos.length) return;

		const photo = photos[index];
		this.currentIndex.set(index);
		this.imageError.set(false);
		this.photo.set(photo);

		this.router.navigate([], { queryParams: { photo: photo.id }, queryParamsHandling: "merge", replaceUrl: true });
	}

	editCaption() {
		this.editingCaption.set(true);
		setTimeout(() => this.captionInput?.getInputElement().then((el) => el.focus()));
	}

	cancelEditingCaption() {
		this.editingCaption.set(false);
	}

	async saveCaption(value: string | number | null | undefined) {
		const current = this.photo();
		if (!current) return;

		const caption = value == null || value === "" ? null : String(value);

		try {
			await this.api.PhotoGalleryApi.updatePhoto(current.id, { caption });
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit popisek.", { color: "warning" });
			return;
		}

		const photo = this.photos.find((item) => item.id === current.id) ?? current;
		photo.caption = caption;
		if (this.photo()?.id === photo.id) this.photo.set({ ...photo });
		this.editingCaption.set(false);
	}

	async toggleTitlePhoto() {
		const photo = this.photo();
		if (!photo) return;

		const isTitle = photo.titlePhoto;
		const photoId = isTitle ? null : photo.id;

		try {
			await this.api.PhotoGalleryApi.setAlbumTitlePhoto(photo.albumId, { photoId });
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit titulní fotku.", { color: "warning" });
			return;
		}

		for (const item of this.photos) item.titlePhoto = false;
		if (!isTitle) photo.titlePhoto = true;

		this.photo.set({ ...photo });

		this.toastService.toast(isTitle ? "Odebráno z titulní fotky." : "Nastaveno jako titulní fotka.");
	}

	async saveTags(tags: string[]) {
		const current = this.photo();
		if (!current) return;

		const photo = this.photos.find((item) => item.id === current.id) ?? current;
		const previous = photo.tags ?? null;
		const next = tags.length ? tags : null;

		const showing = () => this.photo()?.id === photo.id;
		photo.tags = next;
		if (showing()) this.photo.set({ ...photo });
		this.rebuildAlbumTags();

		try {
			await this.api.PhotoGalleryApi.updatePhoto(photo.id, { tags: next });
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit štítky.", { color: "warning" });
			photo.tags = previous;
			if (showing()) this.photo.set({ ...photo });
			this.rebuildAlbumTags();
		}
	}

	async close() {
		await this.modalController.dismiss();
	}

	async delete(photo: SDK.PhotoResponseWithLinks) {
		const alert = await this.alertController.create({
			header: "Smazat fotku",
			message: "Chcete opravdu smazat tuto fotku?",
			buttons: [
				{ text: "Zrušit", role: "cancel" },
				{ text: "Smazat", role: "submit", handler: () => this.deleteConfirmed(photo) },
			],
		});

		alert.present();
	}

	async deleteConfirmed(photo: SDK.PhotoResponseWithLinks) {
		await this.api.PhotoGalleryApi.deletePhoto(photo.id);

		const photos = this.photos;
		const i = photos.findIndex((item) => item.id === photo.id);
		if (i !== -1) photos.splice(i, 1);

		if (!photos.length) {
			this.modalController.dismiss({ refresh: true });
			return;
		}

		this.openPhoto(Math.min(i, photos.length - 1));
	}

	getMpix(width: number, height: number) {
		return Math.round((width * height) / 1000000);
	}
}
