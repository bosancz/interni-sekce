import { DatePipe, NgTemplateOutlet } from "@angular/common";
import { Component, computed, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Params, Router, RouterLink } from "@angular/router";
import {
	AlertController,
	InfiniteScrollCustomEvent,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonItem,
	IonLabel,
	IonList,
	IonSkeletonText,
	NavController,
	ViewWillEnter,
	ViewWillLeave,
} from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { addOutline } from "ionicons/icons";
import { AlbumStatuses } from "src/app/core/config/album-statuses";
import { ApiService } from "src/app/core/services/api.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AdminTableCellDirective } from "src/app/shared/components/admin-table/admin-table-cell.directive";
import { AdminTableColumnComponent } from "src/app/shared/components/admin-table/admin-table-column.component";
import { AdminTableComponent, AdminTableSort } from "src/app/shared/components/admin-table/admin-table.component";
import { FilterPillComponent, FilterPillOption } from "src/app/shared/components/filter-pill/filter-pill.component";
import { SortOption, SortSelectComponent } from "src/app/shared/components/sort-select/sort-select.component";
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
		RouterLink,
		DatePipe,
		IonItem,
		IonLabel,
		IonList,
		IonSkeletonText,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		PageHeaderComponent,
		PageContentComponent,
		FilterComponent,
		FilterPillComponent,
		SortSelectComponent,
		AdminTableComponent,
		AdminTableColumnComponent,
		AdminTableCellDirective,
		AlbumPipe,
		NgTemplateOutlet,
	],
})
export class AlbumsListComponent implements OnInit, ViewWillEnter, ViewWillLeave {
	years = signal<string[]>([]);
	albums = signal<SDK.AlbumResponseWithLinks[] | undefined>(undefined);

	view = signal<"table" | "grid">(this.platformService.isPortrait.value ? "grid" : "table");

	// True when the viewport is at least the lg breakpoint (992px) — filters inline vs. in the modal.
	isDesktop = signal(true);

	page = signal(1);
	readonly pageSize = 50;

	statuses = AlbumStatuses;

	loadingArray = Array(5).fill(null);

	alert?: HTMLIonAlertElement;

	actions = signal<Action[]>([
		{
			text: "Nové album",
			icon: "add-outline",
			pinned: true,
			handler: () => this.create(),
		},
	]);

	filter: UrlParams = {};

	selectedYears = signal<string[]>([]);
	selectedStatuses = signal<string[]>([]);

	sortColumn = signal<string | null>(null);
	// String, not "ASC" | "DESC": a multi-column sort carries a comma-separated list (e.g. "ASC,DESC").
	sortOrder = signal<string>("ASC");

	readonly sortOptions: SortOption[] = [
		{ key: "name", label: "Název alba" },
		{ key: "dateFrom", label: "Datum" },
		{ key: "status", label: "Stav" },
		{ key: "datePublished", label: "Publikováno" },
	];

	// Row link for the declarative admin-table (navigates to the album detail).
	rowLink = (album: SDK.AlbumResponseWithLinks) => "" + album.id;

	yearOptions = computed<FilterPillOption[]>(() =>
		this.years().map((year) => ({ value: year, label: year })),
	);
	statusOptions = computed<FilterPillOption[]>(() =>
		Object.entries(AlbumStatuses).map(([key, status]) => ({
			value: key,
			label: status.name,
			color: status.color,
		})),
	);

	private loadToken = 0;

	constructor(
		private api: ApiService,
		private alertController: AlertController,
		private toastService: ToastService,
		private navController: NavController,
		private platformService: PlatformService,
		private route: ActivatedRoute,
		private router: Router,
	) {
		addIcons({ addOutline });

		// Filters render inline in the toolbar on desktop and inside the filter modal on mobile;
		// this tracks the lg breakpoint (992px) so the template can switch between the two.
		this.platformService.isLg.pipe(untilDestroyed(this)).subscribe((isLg) => this.isDesktop.set(isLg));
	}

	ngOnInit(): void {
		// All filter state (year/status/search) is written to the URL, so drive loading from the
		// query params directly rather than the FilterComponent's `(change)` output (which only
		// emits its own projected controls, and only while the mobile modal is open).
		this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => this.onFilterChange(params));
	}

	ionViewWillEnter() {
		this.loadYears();

		this.platformService.isPortrait.pipe(untilDestroyed(this, "ionViewWillLeave")).subscribe((isPortrait) => {
			this.view.set(isPortrait ? "grid" : "table");
		});
	}

	ionViewWillLeave(): void {
		this.alert?.dismiss();
	}

	onFilterChange(params: Params) {
		this.filter = { ...params };
		this.selectedYears.set(this.normalizeFilterValueToArray(params["year"]));
		this.selectedStatuses.set(this.normalizeFilterValueToArray(params["status"]));
		this.sortColumn.set(params["sort"] ?? null);
		// Keep the raw param — it may be a comma-separated list of directions for a multi-column sort.
		this.sortOrder.set(params["order"] ?? "ASC");
		this.loadAlbums(this.filter);
	}

	onSortChange(sort: AdminTableSort) {
		this.router.navigate([], {
			queryParams: { sort: sort.sort || null, order: sort.sort ? sort.order : null },
			queryParamsHandling: "merge",
			replaceUrl: true,
		});
	}

	setFilterParam(name: string, value: string | string[] | null) {
		let formattedValue = value;

		if (Array.isArray(value)) {
			formattedValue = value.length > 0 ? value.join(",") : null;
		}

		this.router.navigate([], {
			queryParams: { [name]: formattedValue || null },
			queryParamsHandling: "merge",
			replaceUrl: true,
		});
	}

	private normalizeFilterValueToArray(value: string | string[] | null | undefined): string[] {
		if (Array.isArray(value)) return value.filter((item) => !!item).map((item) => String(item));
		if (!value) return [];

		return String(value)
			.split(",")
			.map((item) => item.trim())
			.filter((item) => !!item);
	}

	create() {
		this.createAlbumModal();
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

		const params: SDK.PhotoGalleryApiListAlbumsQueryParams = {
			search: filter.search || undefined,
			status: this.normalizeFilterValueToArray(filter.status) as SDK.ListAlbumsStatusEnum[],
			year: this.normalizeFilterValueToArray(filter.year).map((year) => parseInt(year, 10)),
			sort: (filter.sort as string) || undefined,
			order: (filter.order as string) || undefined,
			offset: (this.page() - 1) * this.pageSize,
			limit: this.pageSize,
		};

		// Guard against out-of-order responses: a slower earlier request must not append its
		// rows on top of a newer filtered result.
		const token = ++this.loadToken;

		const newAlbums = await this.api.PhotoGalleryApi.listAlbums(params).then((res) => res.data);

		if (token !== this.loadToken) return;

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
				{ name: "name", type: "text", placeholder: "Název alba" },
				{ name: "dateFrom", type: "date", placeholder: "Datum od", attributes: { required: true, "aria-label": "Datum od" } },
				{ name: "dateTill", type: "date", placeholder: "Datum do", attributes: { required: true, "aria-label": "Datum do" } },
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
