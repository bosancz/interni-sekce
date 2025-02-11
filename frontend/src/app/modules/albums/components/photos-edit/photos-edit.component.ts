import { Component, HostListener, Input, NgZone, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertController, IonInput, ModalController, Platform, ViewWillLeave } from "@ionic/angular";
import { PhotoResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import Swiper from "swiper";
import { SwiperOptions } from "swiper/types";

@Component({
    selector: "bo-photos-edit",
    templateUrl: "./photos-edit.component.html",
    styleUrls: ["./photos-edit.component.scss"],
    standalone: false
})
export class PhotosEditComponent implements ViewWillLeave {
  photo?: PhotoResponseWithLinks;
  @Input() photos!: PhotoResponseWithLinks[];

  editingCaption = false;

  infoOpen = false;

  currentIndex: number = 0;

  @ViewChild("captionInput") captionInput!: IonInput;

  swiperConfig: SwiperOptions = {
    navigation: this.platform.isLandscape(),
  };

  swiper?: Swiper;

  constructor(
    private modalController: ModalController,
    private api: ApiService,
    private alertController: AlertController,
    private route: ActivatedRoute,
    private router: Router,
    private platform: Platform,
    private ngZone: NgZone,
  ) {}

  ionViewWillLeave(): void {
    this.router.navigate([], { queryParams: { photo: undefined }, replaceUrl: true });
  }

  onSwiper(swiper: Swiper) {
    this.swiper = swiper;
    const photoId = this.route.snapshot.queryParams["photo"];
    const index = this.photos.findIndex((item) => item.id === photoId);

    if (!this.photo || this.photo.id !== photoId) {
      this.swiper?.slideTo(index, 0);
    }
    console.log();

    this.currentIndex = index;
    this.photo = this.photos[index];
  }

  async onSlideChange(swiper: Swiper) {
    // event from swiper is outside of Angular
    this.ngZone.run(() => {
      this.currentIndex = swiper.activeIndex;
      this.photo = this.photos[this.currentIndex];

      this.router.navigate([], { queryParams: { photo: this.photo.id }, replaceUrl: true });
    });
  }

  @HostListener("document:keyup", ["$event"])
  onKeyUp(event: KeyboardEvent) {
    if (!this.editingCaption && !this.infoOpen) {
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

  async nextPhoto() {
    if (!this.swiper) return;
    const index = this.swiper.activeIndex;
    if (index + 1 <= this.photos.length - 1) await this.openPhoto(index + 1);
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
    this.editingCaption = true;
    this.captionInput.getInputElement().then((el) => el.focus());
  }

  cancelEditingCaption() {
    this.editingCaption = false;
  }

  async saveCaption(value: string | number | null | undefined) {
    value = String(value);
    this.photo!.caption = value;
    this.editingCaption = false;
    await this.api.albums.updatePhoto(this.photo!.id, { caption: value });
  }

  async close() {
    await this.modalController.dismiss();
  }

  async delete(photo: PhotoResponseWithLinks) {
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

  async deleteConfirmed(photo: PhotoResponseWithLinks) {
    await this.api.albums.deletePhoto(photo.id);

    const i = this.photos.findIndex((item) => item.id === photo.id);
    this.photos.splice(i, 1);

    if (!this.photos.length) this.modalController.dismiss({ refresh: true });
    else {
      const newI = i > 0 ? i - 1 : 0;

      this.photo = this.photos[newI];

      this.router.navigate([], { queryParams: { photo: this.photo.id }, replaceUrl: true });

      this.openPhoto(newI);
    }
  }

  getMpix(width: number, height: number) {
    return Math.round((width * height) / 1000000);
  }
}
