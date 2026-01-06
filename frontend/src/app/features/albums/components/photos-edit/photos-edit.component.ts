import { DatePipe } from "@angular/common";
import { Component, HostListener, input, NgZone, signal, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
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
	ViewWillLeave,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkOutline, createOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { SDK } from "src/sdk";
import Swiper from "swiper";
import { SwiperOptions } from "swiper/types";

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
	],
})
export class PhotosEditComponent implements ViewWillLeave {
	photo = signal<SDK.PhotoResponseWithLinks | undefined>(undefined);
	photos = input.required<SDK.PhotoResponseWithLinks[]>();

	editingCaption = signal(false);

	infoOpen = signal(false);

	currentIndex = signal(0);

	@ViewChild("captionInput") captionInput!: IonInput;

	swiperConfig: SwiperOptions = {
		navigation: this.platformService.isLandscape.value,
	};

	swiper?: Swiper;

	constructor(
		private modalController: ModalController,
		private api: ApiService,
		private alertController: AlertController,
		private route: ActivatedRoute,
		private router: Router,
		private platformService: PlatformService,
		private ngZone: NgZone,
	) {
		addIcons({ createOutline, checkmarkOutline });
	}

	ionViewWillLeave(): void {
		this.router.navigate([], { queryParams: { photo: undefined }, replaceUrl: true });
	}

	onSwiper(swiper: Swiper) {
		this.swiper = swiper;
		const photoId = this.route.snapshot.queryParams["photo"];
		const photos = this.photos();
		const index = photos.findIndex((item) => item.id === photoId);

		if (!this.photo() || this.photo()!.id !== photoId) {
			this.swiper?.slideTo(index, 0);
		}
		console.log();

		this.currentIndex.set(index);
		this.photo.set(photos[index]);
	}

	async onSlideChange(swiper: Swiper) {
		// event from swiper is outside of Angular
		this.ngZone.run(() => {
			const photos = this.photos();
			this.currentIndex.set(swiper.activeIndex);
			const currentPhoto = photos[swiper.activeIndex];
			this.photo.set(currentPhoto);

			this.router.navigate([], { queryParams: { photo: currentPhoto.id }, replaceUrl: true });
		});
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
					return this.openPhoto(this.photos().length - 1);
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

	async nextPhoto() {
		if (!this.swiper) return;
		const index = this.swiper.activeIndex;
		if (index + 1 <= this.photos().length - 1) await this.openPhoto(index + 1);
	}

	async previousPhoto() {
		if (!this.swiper) return;
		const index = this.swiper.activeIndex;
		if (index - 1 >= 0) await this.openPhoto(index - 1);
	}

	async openPhoto(index: number) {
		if (!this.swiper) return;
		this.swiper.slideTo(index);
	}

	editCaption() {
		this.editingCaption.set(true);
		this.captionInput.getInputElement().then((el) => el.focus());
	}

	cancelEditingCaption() {
		this.editingCaption.set(false);
	}

	async saveCaption(value: string | number | null | undefined) {
		const photo = this.photo();
		if (!photo) return;

		value = String(value);
		const updatedPhoto = { ...photo, caption: value };
		this.photo.set(updatedPhoto);
		this.editingCaption.set(false);
		await this.api.PhotoGalleryApi.updatePhoto(photo.id, { caption: value });
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

		const photos = [...this.photos()];
		const i = photos.findIndex((item) => item.id === photo.id);
		photos.splice(i, 1);
		// Note: photos is an input, so we can't directly modify it
		// This would need to be handled by the parent component

		if (!photos.length) this.modalController.dismiss({ refresh: true });
		else {
			const newI = i > 0 ? i - 1 : 0;

			const newPhoto = photos[newI];
			this.photo.set(newPhoto);

			this.router.navigate([], { queryParams: { photo: newPhoto.id }, replaceUrl: true });

			this.openPhoto(newI);
		}
	}

	getMpix(width: number, height: number) {
		return Math.round((width * height) / 1000000);
	}
}
