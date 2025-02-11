import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertController, NavController } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { AlbumResponseWithLinks, PhotoResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@UntilDestroy()
@Component({
    selector: "bo-albums-view-info",
    templateUrl: "./albums-view-info.component.html",
    styleUrls: ["./albums-view-info.component.scss"],
    standalone: false
})
export class AlbumsViewInfoComponent implements OnInit {
  album?: AlbumResponseWithLinks;

  actions: Action[] = [];

  alert?: HTMLIonAlertElement;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private toastService: ToastService,
    private alertController: AlertController,
    private navController: NavController,
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => this.loadAlbum(params["album"]));
  }

  ngOnDestroy() {
    this.alert?.dismiss();
  }

  async loadAlbum(albumId: number) {
    this.album = await this.api.albums.getAlbum(albumId).then((res) => res.data);
    this.updateActions(this.album);
  }

  private async publish() {
    if (!this.album?._links.unpublishAlbum.allowed) return;
    await this.api.albums.unpublishAlbum(this.album.id);
    await this.loadAlbum(this.album.id);
    this.toastService.toast("Publikováno.");
  }

  private async unpublish() {
    if (!this.album?._links.publishAlbum.allowed) return;
    await this.api.albums.publishAlbum(this.album.id);
    await this.loadAlbum(this.album.id);
    this.toastService.toast("Publikováno.");
  }

  private async delete() {
    this.alert = await this.alertController.create({
      message: `Opravdu chcete smazat album ${this.album?.name}?`,
      buttons: [
        { text: "Zrušit", role: "cancel" },
        { text: "Smazat", handler: () => this.deleteConfirmed() },
      ],
    });

    this.alert.present();
  }

  private async deleteConfirmed() {
    if (!this.album) return;

    await this.api.albums.deleteAlbum(this.album.id);

    this.toastService.toast("Smazáno.");
    this.router.navigate(["/galerie"], { relativeTo: this.route, replaceUrl: true });
  }

  private open() {
    if (!this.album) return;
    window.open("https://bosan.cz/fotogalerie/" + this.album.id);
  }

  onPhotoClick(event: PhotoResponseWithLinks) {
    if (this.album) {
      this.navController.navigateForward(`/galerie/${this.album.id}/fotky`, {
        queryParams: { photo: event.id },
      });
    }
  }

  private updateActions(album: AlbumResponseWithLinks) {
    this.actions = [
      {
        text: "Upravit",
        icon: "create-outline",
        pinned: true,
        handler: () => this.router.navigate(["../upravit"], { relativeTo: this.route }),
      },
      {
        text: "Otevřít na webu",
        icon: "open-outline",
        color: "success",
        hidden: album.status !== "public",
        handler: () => this.open(),
      },
      {
        text: "Publikovat",
        icon: "eye-outline",
        hidden: album.status !== "draft",
        handler: () => this.publish(),
      },
      {
        text: "Zrušit publikaci",
        icon: "eye-off-outline",
        hidden: album.status !== "public",
        handler: () => this.unpublish(),
      },
      {
        text: "Smazat",
        role: "destructive",
        icon: "trash",
        color: "danger",
        handler: () => this.delete(),
      },
    ];
  }
}
