import { Component, ViewChild } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { NavController } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { AlbumResponseWithLinks, AlbumUpdateBody, EventResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@UntilDestroy()
@Component({
  selector: "albums-edit",
  templateUrl: "./albums-edit.component.html",
  styleUrls: ["./albums-edit.component.scss"],
})
export class AlbumsEditComponent {
  album?: AlbumResponseWithLinks;

  actions: Action[] = [
    {
      text: "Uložit",
      handler: () => this.saveAlbum(),
    },
  ];

  @ViewChild("albumForm") albumForm!: NgForm;

  constructor(
    public api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService,
    private navController: NavController,
  ) {}

  ngOnInit() {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => this.loadAlbum(params.album));
  }

  private async loadAlbum(albumId: number) {
    this.album = await this.api.albums.getAlbum(albumId).then((res) => res.data);
  }

  eventUpdated(event: EventResponseWithLinks) {
    if (!this.album || !event) return;

    this.album.dateFrom = event.dateFrom;
    this.album.dateTill = event.dateTill;
  }

  private async saveAlbum() {
    if (!this.album) return;

    if (this.albumForm.invalid) {
      this.toastService.toast("Nelze uložit, zkontrolujte údaje.");
      return;
    }

    let albumData: AlbumUpdateBody = this.albumForm.value;

    // prevent switched date order
    if (albumData.dateFrom && albumData.dateTill) {
      const dates = [albumData.dateFrom, albumData.dateTill];
      dates.sort();
      albumData.dateFrom = dates[0];
      albumData.dateTill = dates[1];
    }

    await this.api.albums.updateAlbum(this.album.id, albumData);

    this.toastService.toast("Uloženo.");

    this.navController.navigateBack(["/galerie", this.album.id]);
  }
}
