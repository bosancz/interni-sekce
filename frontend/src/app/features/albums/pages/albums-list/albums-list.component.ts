import { DatePipe, NgTemplateOutlet } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Params, Router, RouterLink } from "@angular/router";
import {
	AlertController,
	InfiniteScrollCustomEvent,
	IonIcon,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonItemDivider,
	IonList,
	IonSegment,
	IonSegmentButton,
	IonSkeletonText,
	NavController,
	ViewWillEnter,
	ViewWillLeave,
} from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import {
	addOutline,
	eyeOffOutline,
	eyeOutline,
	gridOutline,
	imagesOutline,
	listOutline,
	openOutline,
	trashOutline,
} from "ionicons/icons";
import { AlbumStatuses } from "src/app/core/config/album-statuses";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { UserSettingsService } from "src/app/core/services/user-settings.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AdminTableCellDirective } from "src/app/shared/components/admin-table/admin-table-cell.directive";
import { AdminTableColumnComponent } from "src/app/shared/components/admin-table/admin-table-column.component";
import { AdminTableComponent, AdminTableSort } from "src/app/shared/components/admin-table/admin-table.component";
import { FilterPillComponent, FilterPillOption } from "src/app/shared/components/filter-pill/filter-pill.component";
import { SortOption, SortSelectComponent } from "src/app/shared/components/sort-select/sort-select.component";
import { FilterComponent } from "src/app/shared/components/filter/filter.component";
import { FilterModel, FilterValues } from "src/app/shared/components/filter/filter-model";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { AlbumPipe } from "src/app/shared/pipes/album.pipe";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";

import { UrlParams } from "src/helpers/typings";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "albums-list",
	templateUrl: "./albums-list.component.html",
	styleUrls: ["./albums-list.component.scss"],

	imports: [
		FormsModule,
		DatePipe,
		RouterLink,
		IonIcon,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		IonItemDivider,
		IonList,
		IonSegment,
		IonSegmentButton,
		IonSkeletonText,
		PageHeaderComponent,
		PageContentComponent,
		FilterComponent,
		FilterPillComponent,
		SortSelectComponent,
		AdminTableComponent,
		AdminTableColumnComponent,
		AdminTableCellDirective,
		AlbumPipe,
		PhotoImageUrlPipe,
		NgTemplateOutlet,
	],
	providers: [FilterModel],
})
export class AlbumsListComponent implements OnInit, ViewWillEnter, ViewWillLeave {
	years = signal<string[]>([]);
	albums = signal<SDK.AlbumResponseWithLinks[] | undefined>(undefined);

	private userSettings = inject(UserSettingsService);

	private albumsListView = this.userSettings.watch("albumsListView");

	view = computed<"table" | "grid">(() => this.albumsListView() ?? "table");

	isDesktop = signal(true);

	page = signal(1);
	readonly pageSize = 50;

	statuses = AlbumStatuses;

	alert?: HTMLIonAlertElement;

	actions = signal<Action[]>([
		{
			text: "Nové album",
			icon: "add-outline",
			pinned: true,
			handler: () => this.create(),
		},
		{
			text: "Smazaná alba",
			icon: "trash-outline",
			handler: () => this.router.navigate(["smazane"], { relativeTo: this.route }),
		},
	]);

	filter: UrlParams = {};

	private model = inject(FilterModel);

	selectedYears = computed(() => this.normalizeFilterValueToArray(this.model.value("year")));
	selectedStatuses = computed(() => this.normalizeFilterValueToArray(this.model.value("status")));

	sortColumn = computed<string | null>(() => (this.model.value("sort") as string) ?? null);
	sortOrder = computed<"ASC" | "DESC">(() => (this.model.value("order") === "DESC" ? "DESC" : "ASC"));

	readonly sortOptions: SortOption[] = [
		{ key: "name", label: "Název alba" },
		{ key: "dateFrom", label: "Datum" },
		{ key: "status", label: "Stav" },
		{ key: "datePublished", label: "Publikováno" },
	];

	rowLink = (album: SDK.AlbumResponseWithLinks) => "" + album.id;

	rowActionsHeader = (album: SDK.AlbumResponseWithLinks) => album.name;

	albumActions = (album: SDK.AlbumResponseWithLinks): Action[] => [
		{
			text: "Publikovat",
			icon: "eye-outline",
			color: "primary",
			hidden: !album._links.publishAlbum.allowed,
			handler: () => this.publish(album),
		},
		{
			text: "Otevřít na webu",
			icon: "open-outline",
			color: "success",
			hidden: album.status !== "public",
			handler: () => this.open(album),
		},
		{
			text: "Zrušit publikaci",
			icon: "eye-off-outline",
			color: "danger",
			hidden: !album._links.unpublishAlbum.allowed,
			handler: () => this.unpublish(album),
		},
		{
			text: "Smazat album",
			role: "destructive",
			icon: "trash-outline",
			color: "danger",
			hidden: !album._links.deleteAlbum.allowed,
			handler: () => this.delete(album),
		},
	];

	private async publish(album: SDK.AlbumResponseWithLinks) {
		await this.api.PhotoGalleryApi.publishAlbum(album.id);
		this.toastService.toast("Publikováno.");
		this.loadAlbums(this.filter);
	}

	private async unpublish(album: SDK.AlbumResponseWithLinks) {
		await this.api.PhotoGalleryApi.unpublishAlbum(album.id);
		this.toastService.toast("Publikace zrušena.");
		this.loadAlbums(this.filter);
	}

	private open(album: SDK.AlbumResponseWithLinks) {
		window.open("https://bosan.cz/fotogalerie/" + album.id);
	}

	private async delete(album: SDK.AlbumResponseWithLinks) {
		const confirmation = await this.modalService.deleteConfirmationModal(
			`Opravdu chcete smazat album ${album.name}?`,
		);
		if (!confirmation) return;

		await this.api.PhotoGalleryApi.deleteAlbum(album.id);
		this.toastService.toast("Smazáno.");
		this.loadAlbums(this.filter);
	}

	yearOptions = computed<FilterPillOption[]>(() => this.years().map((year) => ({ value: year, label: year })));
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
		private modalService: ModalService,
		private platformService: PlatformService,
		private route: ActivatedRoute,
		private router: Router,
	) {
		addIcons({
			addOutline,
			eyeOutline,
			eyeOffOutline,
			gridOutline,
			imagesOutline,
			listOutline,
			openOutline,
			trashOutline,
		});

		this.platformService.isLg.pipe(untilDestroyed(this)).subscribe((isLg) => this.isDesktop.set(isLg));
	}

	ngOnInit(): void {
		this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => this.onParams(params));
		this.model.apply$.pipe(untilDestroyed(this)).subscribe((filter) => this.applyFilter(filter));
	}

	ionViewWillEnter() {
		this.loadYears();
	}

	setView(view: "table" | "grid") {
		this.userSettings.set("albumsListView", view);
	}

	ionViewWillLeave(): void {
		this.alert?.dismiss();
	}

	onParams(params: Params) {
		this.model.setCommitted(this.modelFromParams(params));
		this.filter = { ...params };
		this.loadAlbums(this.filter);
	}

	private modelFromParams(p: Params): FilterValues {
		return {
			year: this.normalizeFilterValueToArray(p["year"]),
			status: this.normalizeFilterValueToArray(p["status"]),
			sort: p["sort"] ?? null,
			order: p["order"] ?? null,
		};
	}

	private applyFilter(filter: FilterValues) {
		const list = (value: unknown) => {
			const array = this.normalizeFilterValueToArray(value);
			return array.length ? array.join(",") : null;
		};
		this.router.navigate([], {
			queryParams: {
				year: list(filter["year"]),
				status: list(filter["status"]),
				sort: (filter["sort"] as string) || null,
				order: (filter["order"] as string) || null,
			},
			queryParamsHandling: "merge",
			replaceUrl: true,
		});
	}

	onSortChange(sort: AdminTableSort) {
		this.model.patch({ sort: sort.sort || null, order: sort.sort ? sort.order : null });
	}

	setFilterParam(name: string, value: string | string[] | null) {
		this.model.set(name, value);
	}

	private normalizeFilterValueToArray(value: unknown): string[] {
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
			order: (filter.order as SDK.ListAlbumsOrderEnum) || undefined,
			offset: (this.page() - 1) * this.pageSize,
			limit: this.pageSize,
		};

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
				{
					name: "dateFrom",
					type: "date",
					placeholder: "Datum od",
					attributes: { required: true, "aria-label": "Datum od" },
				},
				{
					name: "dateTill",
					type: "date",
					placeholder: "Datum do",
					attributes: { required: true, "aria-label": "Datum do" },
				},
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
