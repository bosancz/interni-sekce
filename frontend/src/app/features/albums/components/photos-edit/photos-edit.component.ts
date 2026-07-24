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
} from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { SDK } from "src/sdk";

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
	],
})
export class PhotosEditComponent implements OnInit {
	photo = signal<SDK.PhotoResponseWithLinks | undefined>(undefined);
	// Set via Ionic modal componentProps (Object.assign), so it must be a plain property, not a signal input
	@Input() photos!: SDK.PhotoResponseWithLinks[];
	@Input() startPhoto?: SDK.PhotoResponseWithLinks;

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
		addIcons({ createOutline, checkmarkOutline, chevronBackOutline, chevronForwardOutline, imageOutline });
	}

	ngOnInit(): void {
		// the photo to start on comes in as a prop, openPhoto then puts it in the URL —
		// the modal owns the ?photo= param for as long as it is open (see openPhoto)
		let index = this.photos.findIndex((item) => item.id === this.startPhoto?.id);
		if (index === -1) index = 0;

		this.openPhoto(index);
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
		const photo = this.photo();
		if (!photo) return;

		const caption = value == null || value === "" ? null : String(value);

		try {
			await this.api.PhotoGalleryApi.updatePhoto(photo.id, { caption });
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit popisek.", { color: "warning" });
			return; // keep editing so the user can retry
		}

		// mutate the shared object in place so the parent's photo list shows the new caption too
		photo.caption = caption;
		this.photo.set({ ...photo });
		this.editingCaption.set(false);
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
