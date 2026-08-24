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
	// Set via Ionic modal componentProps (Object.assign), so it must be a plain property, not a signal input
	@Input() photos!: SDK.PhotoResponseWithLinks[];
	@Input() startPhoto?: SDK.PhotoResponseWithLinks;

	// every tag used anywhere in the album, offered as ready-made toggles in the editor;
	// grows as new tags are created so they become reusable on the other photos too
	albumTags = signal<string[]>([]);

	// true when the current photo's image failed to load, so we show a message instead
	imageError = signal(false);

	editingCaption = signal(false);

	infoOpen = signal(false);

	currentIndex = signal(0);

	// tapping the photo on mobile hides/shows the top info bar and bottom caption bar
	controlsVisible = signal(true);

	// arrows are shown on the desktop (wide) layout; narrow/mobile navigates by swiping (see onPointerDown/onPointerUp)
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
		addIcons({ createOutline, checkmarkOutline, chevronBackOutline, chevronForwardOutline, imageOutline, star, starOutline });
	}

	ngOnInit(): void {
		this.rebuildAlbumTags();

		// the photo to start on comes in as a prop, openPhoto then puts it in the URL —
		// the modal owns the ?photo= param for as long as it is open (see openPhoto)
		let index = this.photos.findIndex((item) => item.id === this.startPhoto?.id);
		if (index === -1) index = 0;

		this.openPhoto(index);
	}

	// collect the distinct tags across all photos in the album, in first-seen order
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
		// navigate by swipe on touch devices only; desktop uses the arrows
		if (event.pointerType !== "touch") return;
		this.swipeStart = { x: event.clientX, y: event.clientY };
	}

	onPointerUp(event: PointerEvent) {
		if (!this.swipeStart) return;
		const dx = event.clientX - this.swipeStart.x;
		const dy = event.clientY - this.swipeStart.y;
		this.swipeStart = undefined;

		// a mostly-horizontal drag past the threshold navigates between photos
		if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy)) {
			if (dx < 0) this.nextPhoto();
			else this.previousPhoto();
			return;
		}

		// a clear vertical scroll is ignored
		if (Math.abs(dy) >= 50) return;

		// anything else is a tap → toggle the info and caption bars
		if (!this.editingCaption()) this.controlsVisible.update((visible) => !visible);
	}

	openPhoto(index: number) {
		const photos = this.photos;
		if (index < 0 || index >= photos.length) return;

		const photo = photos[index];
		this.currentIndex.set(index);
		this.imageError.set(false);
		this.photo.set(photo);

		// replaces the modal's own history entry, so closing (a history.back()) drops the param with it
		this.router.navigate([], { queryParams: { photo: photo.id }, queryParamsHandling: "merge", replaceUrl: true });
	}

	editCaption() {
		this.editingCaption.set(true);
		// the input only renders after change detection, the ViewChild is not available yet
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
			return; // keep editing so the user can retry
		}

		// mutate the real array element (not the detached copy the signal may hold after a
		// previous edit) so the parent's photo list — and repeated edits — stay in sync; only
		// touch the view if this photo is still the one on screen (the user may have swiped away)
		const photo = this.photos.find((item) => item.id === current.id) ?? current;
		photo.caption = caption;
		if (this.photo()?.id === photo.id) this.photo.set({ ...photo });
		this.editingCaption.set(false);
	}

	// Set this photo as the album's single title photo, or unset it if it already is. Each album has
	// at most one; picking a new one replaces the previous.
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

		// mirror the new selection onto the shared photo objects so the album gallery reflects it too
		for (const item of this.photos) item.titlePhoto = false;
		if (!isTitle) photo.titlePhoto = true;

		this.photo.set({ ...photo });

		this.toastService.toast(isTitle ? "Odebráno z titulní fotky." : "Nastaveno jako titulní fotka.");
	}

	async saveTags(tags: string[]) {
		const current = this.photo();
		if (!current) return;

		// resolve the real array element so the parent gallery/list see the change too
		const photo = this.photos.find((item) => item.id === current.id) ?? current;
		const previous = photo.tags ?? null;
		const next = tags.length ? tags : null;

		// Apply optimistically and synchronously: the editor is fully controlled off the photo's
		// tags, so a quick second toggle must derive its set from this pending value rather than
		// the not-yet-persisted previous one (otherwise concurrent PATCHes would drop a tag). The
		// chip also reacts instantly. Reflect it in the view only while this photo is on screen.
		const showing = () => this.photo()?.id === photo.id;
		photo.tags = next;
		if (showing()) this.photo.set({ ...photo });
		this.rebuildAlbumTags();

		try {
			await this.api.PhotoGalleryApi.updatePhoto(photo.id, { tags: next });
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit štítky.", { color: "warning" });
			// roll the optimistic change back, again only touching the view if still shown
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

		// mutate the input array in place so the parent gallery reflects the deletion
		const photos = this.photos;
		const i = photos.findIndex((item) => item.id === photo.id);
		if (i !== -1) photos.splice(i, 1);

		if (!photos.length) {
			this.modalController.dismiss({ refresh: true });
			return;
		}

		// show the photo that shifted into this slot, or the last one
		this.openPhoto(Math.min(i, photos.length - 1));
	}

	getMpix(width: number, height: number) {
		return Math.round((width * height) / 1000000);
	}
}
