import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ModalController, Platform, ViewWillLeave } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { AlbumResponseWithLinks, PhotoResponseWithLinks } from "src/app/api";
import { PhotosEditComponent } from "src/app/modules/albums/components/photos-edit/photos-edit.component";
import { PhotosUploadComponent } from "src/app/modules/albums/components/photos-upload/photos-upload.component";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@UntilDestroy()
@Component({
    selector: "bo-albums-view-photos",
    templateUrl: "./albums-view-photos.component.html",
    styleUrls: ["./albums-view-photos.component.scss"],
    standalone: false
})
export class AlbumsViewPhotosComponent implements OnInit, ViewWillLeave {
  album?: AlbumResponseWithLinks;

  photos?: PhotoResponseWithLinks[];

  actions: Action[] = [];

  photosView: "list" | "grid" = "list";

  enableOrdering = false;
  enableDeleting = false;

  oldOrder?: PhotoResponseWithLinks[];

  showCheckboxes = false;
  selectedPhotos: PhotoResponseWithLinks[] = [];

  photosModal?: HTMLIonModalElement;
  uploadModal?: HTMLIonModalElement;

  constructor(
    private api: ApiService,
    public platform: Platform,
    public modalController: ModalController,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      if (this.album?.id !== params["album"]) this.loadPhotos(params["album"]);
    });

    this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => {
      if (params.photo && !this.photosModal) {
        const photo = this.photos?.find((item) => item.id);
        if (photo) this.openPhoto(photo);
      }
      if (!params.photo && this.photosModal) {
        this.photosModal.dismiss();
      }
    });
  }

  ionViewWillLeave() {
    this.photosModal?.dismiss();
    this.uploadModal?.dismiss();
  }

  async loadPhotos(albumId: number) {
    this.album = await this.api.albums.getAlbum(albumId).then((res) => res.data);
    this.actions = this.getActions(this.album);

    this.photos = await this.api.albums.getAlbumPhotos(albumId).then((res) => res.data);

    if (this.route.snapshot.queryParams["photo"] && !this.photosModal) {
      const photo = this.photos?.find((item) => item.id);
      if (photo) this.openPhoto(photo);
    }
  }

  private async saveAlbum() {}

  onPhotoClick(event: CustomEvent<PhotoResponseWithLinks | undefined>) {
    if (this.enableDeleting || this.enableOrdering) return;

    if (!event.detail) return;

    this.router.navigate([], { queryParams: { photo: event.detail.id } });
  }

  async openPhoto(photo: PhotoResponseWithLinks) {
    if (this.photosModal) this.photosModal.dismiss();

    const originalCount = this.photos?.length;

    this.photosModal = await this.modalController.create({
      component: PhotosEditComponent,
      componentProps: {
        photos: this.photos,
      },
      backdropDismiss: false,
      cssClass: "ion-modal-lg",
    });

    this.photosModal.onWillDismiss().then(() => {
      this.photosModal = undefined;

      if (this.photos?.length !== originalCount) this.loadPhotos(this.album!.id); // album must be present when closing modal
    });

    this.photosModal.present();
  }

  orderByDate() {
    this.photos?.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  orderByName() {
    this.photos?.sort((a, b) => a.name.localeCompare(b.name));
  }

  startOrdering() {
    this.enableOrdering = true;
    this.photosView = "list";
    this.oldOrder = this.photos?.slice();
    this.actions = [
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
        hidden: this.platform.is("ios"),
        handler: () => this.endOrdering(),
      },
    ];
  }

  endOrdering() {
    if (this.oldOrder) {
      this.photos = this.oldOrder;
      this.oldOrder = undefined;
    }
    this.actions = this.getActions(this.album!);
    this.enableOrdering = false;
  }

  startDeleting() {
    this.startSelecting();
    this.enableDeleting = true;
    this.actions = [
      {
        text: "Smazat",
        role: "destructive",
        color: "danger",
        pinned: true,
        handler: () => this.deletePhotos().then(() => this.endDeleting()),
      },
      {
        text: "Zrušit",
        hidden: this.platform.is("ios"),
        handler: () => this.endDeleting(),
      },
    ];
  }

  endDeleting() {
    this.enableDeleting = false;
    this.stopSelecting();
    this.actions = this.getActions(this.album!);
  }

  private startSelecting() {
    this.showCheckboxes = true;
    this.selectedPhotos = [];
  }

  private stopSelecting() {
    this.showCheckboxes = false;
    this.selectedPhotos = [];
  }

  private async deletePhotos() {
    const toast = await this.toastService.toast("Mažu fotky...");

    for (let photo of this.selectedPhotos) {
      await this.api.albums.deletePhoto(photo.id);
    }

    await this.loadPhotos(this.album!.id); // wouldnt be able to delete photos if no album was present

    toast.dismiss();
    this.toastService.toast("Fotky smazány");
  }

  private async uploadPhotos() {
    if (this.uploadModal) this.uploadModal.dismiss();

    this.uploadModal = await this.modalController.create({
      component: PhotosUploadComponent,
      componentProps: {
        album: this.album,
      },
      backdropDismiss: false,
    });

    this.uploadModal.onDidDismiss().then((event) => {
      if (event.data) this.loadPhotos(this.album!.id);
    });

    this.uploadModal.present();
  }

  private async saveOrdering() {
    if (!this.album || !this.photos) return;

    // TODO: vymyslet jak se bude ukládat řazení fotek!!!

    // const data: Pick<AlbumResponseWithLinks, "photos"> = {
    //   photos: this.photos.map((photo) => photo.id),
    // };

    // await this.albumsService.updateAlbum(this.album.id, data);

    // await this.loadPhotos(this.album.id);

    // this.oldOrder = undefined;

    // this.toastService.toast("Uloženo.");
  }

  private getActions(album: AlbumResponseWithLinks): Action[] {
    return [
      {
        text: "Seřadit",
        icon: "swap-vertical-outline",
        handler: () => this.startOrdering(),
      },
      {
        text: "Nahrát",
        pinned: true,
        icon: "cloud-upload-outline",
        handler: () => this.uploadPhotos(),
      },
      {
        text: "Smazat",
        color: "danger",
        role: "destructive",
        icon: "trash-outline",
        handler: () => this.startDeleting(),
      },
    ];
  }
}
