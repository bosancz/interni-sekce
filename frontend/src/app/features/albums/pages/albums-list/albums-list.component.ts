import { DatePipe, KeyValuePipe } from "@angular/common";
import { Component, signal } from "@angular/core";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {
    AlertController,
    InfiniteScrollCustomEvent,
    NavController,
    ViewWillEnter,
    ViewWillLeave,
} from "@ionic/angular";
import {
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonSkeletonText,
} from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { AlbumStatuses } from "src/app/core/config/album-statuses";
import { ApiService } from "src/app/services/api.service";
import { PlatformService } from "src/app/services/platform.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AdminTableComponent } from "src/app/shared/components/admin-table/admin-table.component";
import { FilterComponent } from "src/app/shared/components/filter/filter.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { AlbumPipe } from "src/app/shared/pipes/album.pipe";

import { UrlParams } from "src/helpers/typings";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "albums-list",
	templateUrl: "./albums-list.component.html",
	styleUrls: ["./albums-list.component.scss"],
	
	imports: [
		FormsModule,
		ReactiveFormsModule,
		RouterLink,
		DatePipe,
		KeyValuePipe,
		IonItem,
		IonSelect,
		IonSelectOption,
		IonSkeletonText,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		PageHeaderComponent,
		PageContentComponent,
		FilterComponent,
		AdminTableComponent,
		AlbumPipe,
	],
})
export class AlbumsListComponent implements ViewWillEnter, ViewWillLeave {
	years = signal<string[]>([]);
	albums = signal<SDK.AlbumResponseWithLinks[] | undefined>(undefined);

	view = signal<"table" | "grid">(this.platformService.isPortrait.value ? "grid" : "table");

	page = signal(1);
	readonly pageSize = 50;

	statuses = AlbumStatuses;

	loadingArray = Array(5).fill(null);

	actions = signal<Action[]>([]);

	alert?: HTMLIonAlertElement;

	filter: UrlParams = {};

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
		private platformService: PlatformService,
		private route: ActivatedRoute,
		private router: Router,
	) {}

	ionViewWillEnter() {
		this.loadYears();

		this.api.rootLinks
			.pipe(untilDestroyed(this, "ionViewWillLeave"))
			.subscribe((endpoints) => this.setActions(endpoints));

		this.platformService.isPortrait
			.pipe(untilDestroyed(this, "ionViewWillLeave"))
			.subscribe((isPortrait) => {
				this.view.set(isPortrait ? "grid" : "table");
			});
	}

	ionViewWillLeave(): void {
		this.alert?.dismiss();
	}

	onFilterChange(filter: UrlParams) {
		this.filter = filter;
		this.loadAlbums(filter);
	}

	setActions(endpoints: SDK.RootResponseLinks | null) {
		this.actions.set([
			{
				text: "Přidat",
				handler: () => this.createAlbumModal(),
				disabled: !endpoints?.createAlbum.allowed,
				hidden: !endpoints?.createAlbum.applicable,
			},
		]);
	}

	async onInfiniteScroll(e: InfiniteScrollCustomEvent) {
		await this.loadAlbums(this.filter, true);
		e.target.complete();
	}

	private async loadYears() {
		const years = await this.api.PhotoGalleryApi.getAlbumsYears().then((res) => res.data.map((y) => String(y)));
		years.sort((a, b) => b.localeCompare(a));
		this.years.set(years);
	}

	private async loadAlbums(filter: UrlParams, loadMore = false) {
		if (loadMore) {
			const currentAlbums = this.albums();
			if (currentAlbums && currentAlbums.length < this.page() * this.pageSize) return;
			this.page.set(this.page() + 1);
		} else {
			this.page.set(1);
			this.albums.set(undefined);
		}

		// TODO: validate SDK.ListAlbumsStatusEnum
		const params: SDK.PhotoGalleryApiListAlbumsQueryParams = {
			search: filter.search || undefined,
			status: (filter.status as SDK.ListAlbumsStatusEnum) || undefined,
			year: filter.year ? String(filter.year) : undefined,
			offset: (this.page() - 1) * this.pageSize,
			limit: this.pageSize,
		};

		const newAlbums = await this.api.PhotoGalleryApi.listAlbums(params).then((res) => res.data);

		const currentAlbums = this.albums();
		if (!currentAlbums) {
			this.albums.set(newAlbums);
		} else {
			this.albums.set([...currentAlbums, ...newAlbums]);
		}
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
					handler: (data: SDK.AlbumCreateBody) => this.onCreateAlbum(data),
				},
			],
		});

		await this.alert.present();
	}

	private onCreateAlbum(albumData: SDK.AlbumCreateBody) {
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

	private async createAlbum(albumData: SDK.AlbumCreateBody) {
		if (!albumData.name || !albumData.dateFrom || !albumData.dateTill) {
			this.toastService.toast("Musíš vyplnit jméno i datumy");
			return false;
		}

		const album = await this.api.PhotoGalleryApi.createAlbum(albumData).then((res) => res.data);

		await this.navController.navigateForward("/galerie/" + album.id);
	}
}
