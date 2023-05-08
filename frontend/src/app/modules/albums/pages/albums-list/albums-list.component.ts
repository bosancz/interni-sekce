import { Component, OnDestroy, OnInit } from "@angular/core";
import { AlertController, NavController, ViewWillEnter } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { transliterate } from "inflected";
import { BehaviorSubject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { AlbumCreateBody, AlbumResponse } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@UntilDestroy()
@Component({
  selector: "albums-list",
  templateUrl: "./albums-list.component.html",
  styleUrls: ["./albums-list.component.scss"],
})
export class AlbumsListComponent implements OnInit, OnDestroy, ViewWillEnter {
  albums: AlbumResponse[] = [];
  filteredAlbums: AlbumResponse[] = [];

  searchIndex: string[] = [];

  statuses = [
    { id: "public", name: "zveřejněná" },
    { id: "draft", name: "v přípravě" },
  ];

  statusesIndex = this.statuses.reduce((acc, cur) => ((acc[cur.id] = cur.name), acc), {} as { [id: string]: string });

  loadingArray = Array(5).fill(null);

  actions: Action[] = [
    {
      text: "Nové",
      handler: () => this.createAlbumModal(),
    },
  ];

  alert?: HTMLIonAlertElement;

  searchString = new BehaviorSubject<string>("");

  constructor(
    private api: ApiService,
    private alertController: AlertController,
    private toastService: ToastService,
    private navController: NavController,
  ) {}

  ngOnInit() {
    this.searchString
      .pipe(untilDestroyed(this))
      .pipe(debounceTime(250))
      .subscribe((searchString) => {
        this.filteredAlbums = this.filterAlbums(this.albums, searchString);
      });
  }

  ionViewWillEnter() {
    this.loadAlbums();
  }

  ngOnDestroy() {
    this.alert?.dismiss();
  }

  private async loadAlbums() {
    this.albums = [];

    const albums = await this.api.albums.listAlbums().then((res) => res.data);

    albums.sort((a, b) => {
      return (
        a.status.localeCompare(b.status) || (a.dateFrom && b.dateFrom && b.dateFrom?.localeCompare(a.dateFrom)) || 0
      );
    });

    this.searchIndex = albums.map((album) => {
      return [transliterate(album.name)].filter((item) => !!item).join(" ");
    });

    this.albums = albums;
    this.filteredAlbums = this.filterAlbums(this.albums, this.searchString.value);
  }

  private filterAlbums(albums: AlbumResponse[], searchString: string) {
    if (!searchString) return albums;

    const search_re = new RegExp("(^| )" + transliterate(searchString).replace(/[^a-zA-Z0-9]/g, ""), "i");

    return albums.filter((event, i) => search_re.test(this.searchIndex[i]));
  }

  private async createAlbumModal() {
    this.alert = await this.alertController.create({
      header: "Vytvořit album",
      inputs: [
        { name: "name", type: "text" },
        { name: "dateFrom", type: "date", attributes: { required: true } },
        { name: "dateTill", type: "date", attributes: { required: true } },
      ],
      buttons: [
        { role: "cancel", text: "Zrušit" },
        {
          text: "Vytvořit",
          handler: (data: AlbumCreateBody) => this.onCreateAlbum(data),
        },
      ],
    });

    await this.alert.present();
  }

  private onCreateAlbum(albumData: AlbumCreateBody) {
    // prevent switched date order
    if (albumData.dateFrom && albumData.dateTill) {
      const dates = [albumData.dateFrom, albumData.dateTill];
      dates.sort();
      albumData.dateFrom = dates[0];
      albumData.dateTill = dates[1];
    }

    if (!albumData.name || !albumData.dateFrom || !albumData.dateTill) {
      this.toastService.toast("Musíš vyplnit jméno i datumy");
      return false;
    }

    this.createAlbum(albumData);
  }

  private async createAlbum(albumData: AlbumCreateBody) {
    if (!albumData.name || !albumData.dateFrom || !albumData.dateTill) {
      this.toastService.toast("Musíš vyplnit jméno i datumy");
      return false;
    }

    const album = await this.api.albums.createAlbum(albumData).then((res) => res.data);

    await this.navController.navigateForward("/galerie/" + album.id);
  }
}
