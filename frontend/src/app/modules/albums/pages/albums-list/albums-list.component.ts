import { Component } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import {
  AlertController,
  InfiniteScrollCustomEvent,
  NavController,
  Platform,
  ViewWillEnter,
  ViewWillLeave,
} from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import {
  AlbumCreateBody,
  AlbumResponseWithLinks,
  PhotoGalleryApiListAlbumsQueryParams,
  RootResponseLinks,
} from "src/app/api";
import { AlbumStatuses } from "src/app/config/album-statuses";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { UrlParams } from "src/helpers/typings";

@UntilDestroy()
@Component({
  selector: "albums-list",
  templateUrl: "./albums-list.component.html",
  styleUrls: ["./albums-list.component.scss"],
})
export class AlbumsListComponent implements ViewWillEnter, ViewWillLeave {
  years: number[] = [];
  albums?: AlbumResponseWithLinks[];

  view: "table" | "grid" = this.platform.isPortrait() ? "grid" : "table";

  page = 1;
  readonly pageSize = 50;

  statuses = AlbumStatuses;

  loadingArray = Array(5).fill(null);

  actions: Action[] = [];

  alert?: HTMLIonAlertElement;

  readonly filterForm = new FormGroup({
    search: new FormControl<string | null>(null),
    status: new FormControl<string | null>(null),
    year: new FormControl<number | null>(null),
  });

  constructor(
    private api: ApiService,
    private alertController: AlertController,
    private toastService: ToastService,
    private navController: NavController,
    private platform: Platform,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ionViewWillEnter() {
    this.loadYears();

    this.route.queryParams.pipe(untilDestroyed(this, "ionViewWillLeave")).subscribe((queryParams) => {
      this.setFilter(queryParams);
      this.loadAlbums();
    });

    this.api.endpoints
      .pipe(untilDestroyed(this, "ionViewWillLeave"))
      .subscribe((endpoints) => this.setActions(endpoints));
  }

  ionViewWillLeave(): void {
    this.alert?.dismiss();
  }

  setParams(params: UrlParams) {
    this.router.navigate([], { replaceUrl: true, queryParams: params });
  }

  onFilterChange() {
    const filter = this.filterForm.value;

    this.setParams({
      search: filter.search || undefined,
      status: filter.status || undefined,
      year: filter.year?.toString() || undefined,
    });
  }

  resetFilter() {
    this.setFilter(this.route.snapshot.queryParams);
  }

  private setFilter(data: UrlParams) {
    console.log({
      search: data.search || null,
      status: data.status || null,
      year: data.year ? parseInt(data.year) : null,
    });
    this.filterForm.setValue({
      search: data.search || null,
      status: data.status || null,
      year: data.year ? parseInt(data.year) : null,
    });
  }

  setActions(endpoints: RootResponseLinks | null) {
    this.actions = [
      {
        text: "Přidat",
        handler: () => this.createAlbumModal(),
        disabled: !endpoints?.createAlbum.allowed,
        hidden: !endpoints?.createAlbum.applicable,
      },
    ];
  }

  async onInfiniteScroll(e: InfiniteScrollCustomEvent) {
    await this.loadAlbums(true);
    e.target.complete();
  }

  private async loadYears() {
    this.years = await this.api.albums.getAlbumsYears().then((res) => res.data);
    this.years.sort((a, b) => b - a);
  }

  private async loadAlbums(loadMore = false) {
    if (loadMore) {
      if (this.albums && this.albums.length < this.page * this.pageSize) return;
      this.page++;
    } else {
      this.albums = undefined;
    }

    const filter = this.filterForm.value;

    const params: PhotoGalleryApiListAlbumsQueryParams = {
      search: filter.search || undefined,
      status: filter.status || undefined,
      year: filter.year ? String(filter.year) : undefined,
      offset: (this.page - 1) * this.pageSize,
      limit: this.pageSize,
    };

    const albums = await this.api.albums.listAlbums(params).then((res) => res.data);

    if (!this.albums) this.albums = [];
    this.albums.push(...albums);
  }

  // TODO: move to own page
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
