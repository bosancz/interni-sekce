import { CommonModule } from "@angular/common";
import {
	afterNextRender,
	Component,
	computed,
	ElementRef,
	inject,
	Injector,
	OnDestroy,
	OnInit,
	signal,
	viewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Params, Router } from "@angular/router";
import {
	InfiniteScrollCustomEvent,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonItemDivider,
	IonList,
} from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import {
	addOutline,
	arrowBackOutline,
	arrowForwardOutline,
	arrowUndoOutline,
	closeOutline,
	eyeOffOutline,
	eyeOutline,
	handLeftOutline,
	trashOutline,
} from "ionicons/icons";
import { DateTime } from "luxon";
import { EventStatus, EventStatusID, EventStatuses } from "src/app/core/config/event-statuses";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AdminTableCellDirective } from "src/app/shared/components/admin-table/admin-table-cell.directive";
import { AdminTableColumnComponent } from "src/app/shared/components/admin-table/admin-table-column.component";
import { AdminTableComponent, AdminTableSort } from "src/app/shared/components/admin-table/admin-table.component";
import { EventCardComponent } from "src/app/shared/components/event-card/event-card.component";
import { EventStatusBadgeComponent } from "src/app/shared/components/event-status-badge/event-status-badge.component";
import { FilterPillComponent, FilterPillOption } from "src/app/shared/components/filter-pill/filter-pill.component";
import { SortOption, SortSelectComponent } from "src/app/shared/components/sort-select/sort-select.component";
import { FilterComponent } from "src/app/shared/components/filter/filter.component";
import { FilterModel, FilterValues } from "src/app/shared/components/filter/filter-model";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { ExtractExisting, UrlParams } from "src/helpers/typings";
import { SDK } from "src/sdk";
import { GroupPipe } from "../../../../shared/pipes/group.pipe";
import { MemberPipe } from "../../../../shared/pipes/member.pipe";
import { EventCreateModalComponent } from "../../components/event-create-modal/event-create-modal.component";

type EventStatusActions = ExtractExisting<
	keyof SDK.EventResponseWithLinks["_links"],
	"publishEvent" | "unpublishEvent" | "uncancelEvent" | "cancelEvent" | "rejectEvent" | "submitEvent"
>;

@UntilDestroy()
@Component({
	selector: "bo-events-list",
	templateUrl: "./events-list.component.html",
	styleUrls: ["./events-list.component.scss"],

	imports: [
		CommonModule,
		FormsModule,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		IonItemDivider,
		IonList,
		EventStatusBadgeComponent,
		EventCardComponent,
		GroupPipe,
		MemberPipe,
		AdminTableComponent,
		AdminTableColumnComponent,
		AdminTableCellDirective,
		PageContentComponent,
		PageHeaderComponent,
		FilterComponent,
		FilterPillComponent,
		SortSelectComponent,
	],
	providers: [FilterModel],
})
export class EventsListComponent implements OnInit, OnDestroy {
	private model = inject(FilterModel);

	events = signal<SDK.EventResponseWithLinks[]>([]);
	years = signal<number[]>([]);
	currentYearString = String(new Date().getFullYear());

	readonly futureFilterValue = "budouci";

	selectedYears = computed(() => this.normalizeFilterValueToArray(this.model.value("year")));
	selectedStatuses = computed(() => this.normalizeFilterValueToArray(this.model.value("status")));
	selectedLeaderFilters = computed(() => this.normalizeFilterValueToArray(this.model.value("leaders")));

	private readonly defaultSortColumn = "dateFrom";

	private defaultSortOrder(dateFilters: string[]): "ASC" | "DESC" {
		return dateFilters.includes(this.futureFilterValue) ? "ASC" : "DESC";
	}

	sortColumn = computed<string | null>(() => (this.model.value("sort") as string) ?? this.defaultSortColumn);
	sortOrder = computed<"ASC" | "DESC">(() => {
		const order = this.model.value("order");
		return order === "ASC" || order === "DESC" ? order : this.defaultSortOrder(this.selectedYears());
	});

	readonly sortOptions: SortOption[] = [
		{ key: "name", label: "Název" },
		{ key: "dateFrom", label: "Datum" },
		{ key: "status", label: "Stav" },
	];

	statuses = signal<Record<string, EventStatus>>({});

	isDesktop = signal(true);

	yearOptions = computed<FilterPillOption[]>(() => [
		{ value: this.futureFilterValue, label: "Budoucí" },
		...this.years().map((year) => ({ value: String(year), label: String(year) })),
	]);
	statusOptions = computed<FilterPillOption[]>(() =>
		Object.entries(this.statuses()).map(([key, status]) => ({
			value: key,
			label: status.name,
			background: status.background,
			foreground: status.foreground,
		})),
	);
	readonly leaderOptions: FilterPillOption[] = [
		{ value: "my", label: "Moje akce" },
		{ value: "noleader", label: "Akce bez vedoucího" },
	];

	actions = signal<Action[]>([
		{
			text: "Nová akce",
			icon: "add-outline",
			pinned: true,
			handler: () => this.create(),
		},
		{
			text: "Smazané akce",
			icon: "trash-outline",
			handler: () => this.router.navigate(["smazane"], { relativeTo: this.route }),
		},
	]);

	page = 1;
	readonly pageSize = 50;
	private loadToken = 0;
	private loadedFilterKey: string | null = null;

	filter: UrlParams = {};

	rowLink = (event: SDK.EventResponseWithLinks) => "" + event.id;
	rowId = (event: SDK.EventResponseWithLinks) => "event-" + event.id;

	hoveredEvent = signal<SDK.EventResponseWithLinks | undefined>(undefined);
	previewPosition = signal<{ top: number; left: number } | null>(null);

	private readonly previewDelayMs = 500;
	private previewTimer: ReturnType<typeof setTimeout> | null = null;
	private pendingEventId: number | null = null;

	private previewPaused = false;

	private previewOverlay = viewChild<ElementRef<HTMLElement>>("previewOverlay");
	private previewOverlayEl: HTMLElement | null = null;

	constructor(
		private api: ApiService,
		private router: Router,
		private route: ActivatedRoute,
		private injector: Injector,
		private modalService: ModalService,
		private toasts: ToastService,
		private platformService: PlatformService,
	) {
		this.platformService.isLg.pipe(untilDestroyed(this)).subscribe((isLg) => this.isDesktop.set(isLg));

		addIcons({
			addOutline,
			handLeftOutline,
			arrowForwardOutline,
			eyeOutline,
			arrowBackOutline,
			eyeOffOutline,
			closeOutline,
			arrowUndoOutline,
			trashOutline,
		});

		afterNextRender(
			() => {
				const overlay = this.previewOverlay()?.nativeElement;
				if (overlay) {
					this.previewOverlayEl = overlay;
					document.body.appendChild(overlay);
				}
			},
			{ injector: this.injector },
		);
	}

	ionViewWillEnter(): void {
		this.previewPaused = false;
	}

	ionViewWillLeave(): void {
		this.previewPaused = true;
		this.clearHover();
	}

	ngOnDestroy(): void {
		this.clearTimer();
		this.previewOverlayEl?.remove();
		this.previewOverlayEl = null;
	}

	rowActionsHeader = (event: SDK.EventResponseWithLinks) => event.name;

	eventActions = (event: SDK.EventResponseWithLinks): Action[] => {
		return [
			{
				text: "Vést akci",
				color: "success",
				icon: handLeftOutline,
				hidden: !event._links.leadEvent.allowed,
				handler: () => this.leadEvent(event),
			},
			{
				text: "Ke schválení",
				icon: arrowForwardOutline,
				color: "primary",
				hidden: !event._links.submitEvent.allowed,
				handler: () => this.eventStatusAction(event, "submitEvent"),
			},
			{
				text: "Do programu",
				icon: eyeOutline,
				color: "primary",
				hidden: !event._links.publishEvent.allowed,
				handler: () => this.eventStatusAction(event, "publishEvent"),
			},
			{
				text: "Vrátit k úpravám",
				icon: arrowBackOutline,
				color: "danger",
				hidden: !event._links.rejectEvent.allowed,
				handler: () => this.eventStatusAction(event, "rejectEvent"),
			},
			{
				text: "Odebrat z programu",
				icon: eyeOffOutline,
				color: "danger",
				hidden: !event._links.unpublishEvent.allowed,
				handler: () => this.eventStatusAction(event, "unpublishEvent"),
			},
			{
				text: "Označit jako zrušenou",
				color: "danger",
				icon: closeOutline,
				hidden: !event._links.cancelEvent.allowed,
				handler: () => this.eventStatusAction(event, "cancelEvent"),
			},
			{
				text: "Odzrušit",
				icon: arrowUndoOutline,
				hidden: !event._links.uncancelEvent.allowed,
				handler: () => this.eventStatusAction(event, "uncancelEvent"),
			},
			{
				text: "Smazat",
				role: "destructive",
				color: "danger",
				icon: trashOutline,
				hidden: !event._links.deleteEvent.allowed,
				handler: () => this.deleteEvent(event),
			},
			{
				text: "Obnovit",
				role: "destructive",
				color: "success",
				icon: arrowUndoOutline,
				hidden: !event._links.restoreEvent.allowed,
				handler: () => this.restoreEvent(event),
			},
		];
	};

	private async leadEvent(event: SDK.EventResponseWithLinks) {
		await this.api.EventsApi.leadEvent(event.id);
		this.toasts.toast("Uloženo");
		this.loadEvents(this.filter);
	}

	private async eventStatusAction(event: SDK.EventResponseWithLinks, action: EventStatusActions) {
		if (!event._links[action].allowed) {
			this.toasts.toast("K této akci nemáš oprávnění.");
			return;
		}

		const statusNote = window.prompt("Poznámka ke změně stavu (můžeš nechat prázdné):");
		if (statusNote === null) return;

		await this.api.EventsApi[action](event.id, { statusNote });
		this.toasts.toast("Uloženo");
		this.loadEvents(this.filter);
	}

	private async deleteEvent(event: SDK.EventResponseWithLinks) {
		const confirmation = await this.modalService.deleteConfirmationModal(
			`Opravdu chcete smazat akci ${event.name}?`,
		);
		if (!confirmation) return;

		await this.api.EventsApi.deleteEvent(event.id);
		this.toasts.toast("Akce smazána");
		this.loadEvents(this.filter);
	}

	private async restoreEvent(event: SDK.EventResponseWithLinks) {
		await this.api.EventsApi.restoreEvent(event.id);
		this.toasts.toast("Akce obnovena");
		this.loadEvents(this.filter);
	}

	async create() {
		const eventData = await this.modalService.componentModal(EventCreateModalComponent);
		if (!eventData) return;

		const event = await this.api.EventsApi.createEvent(eventData).then((res) => res.data);
		this.toasts.toast("Akce vytvořena.");

		this.router.navigate([event.id], { relativeTo: this.route });
	}

	ngOnInit(): void {
		this.loadYears();
		this.loadStatuses();

		this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => this.onParams(params));
		this.model.apply$.pipe(untilDestroyed(this)).subscribe((filter) => this.applyFilter(filter));
	}

	onParams(params: Params) {
		this.model.setCommitted(this.modelFromParams(params));

		const filterKey = this.getFilterKey(params);
		if (filterKey === this.loadedFilterKey) return;
		this.loadedFilterKey = filterKey;

		this.filter = { ...params };
		this.loadEvents(this.filter);
	}

	private modelFromParams(p: Params): FilterValues {
		return {
			year: this.normalizeFilterValueToArray(p["year"]),
			status: this.normalizeFilterValueToArray(p["status"]),
			leaders: this.normalizeFilterValueToArray(p["leaders"]),
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
				leaders: list(filter["leaders"]),
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

	setDateFilter(values: string[]) {
		const wasFuture = this.selectedYears().includes(this.futureFilterValue);
		const isFuture = values.includes(this.futureFilterValue);

		if (isFuture && !wasFuture) {
			this.setFilterParam("year", [this.futureFilterValue]);
		} else if (isFuture && values.length > 1) {
			this.setFilterParam(
				"year",
				values.filter((value) => value !== this.futureFilterValue),
			);
		} else {
			this.setFilterParam("year", values);
		}
	}

	toggleCurrentYear() {
		const selectedYears = this.selectedYears();
		const hasCurrentYear = selectedYears.includes(this.currentYearString);

		this.setFilterParam(
			"year",
			hasCurrentYear
				? selectedYears.filter((year) => year !== this.currentYearString)
				: [...selectedYears, this.currentYearString],
		);
	}

	getLeadersString(event: SDK.EventResponseWithLinks) {
		return event.leaders?.map((item) => item.nickname).join(", ");
	}

	private async loadYears() {
		const years = await this.api.EventsApi.getEventsYears().then((res) => res.data);
		years.sort((a, b) => b - a);

		this.years.set(years);
	}

	private async loadStatuses() {
		const statuses = await this.api.EventsApi.getEventsStatuses().then((res) => res.data);
		const statusMap = Object.fromEntries(
			statuses.map((status) => [
				status,
				EventStatuses[status as EventStatusID] || {
					name: status,
					color: "#ccc",
					background: "var(--bo-neutral-pill, #eef1f6)",
					foreground: "var(--bo-neutral-pill-text, #6b7185)",
				},
			]),
		);

		this.statuses.set(statusMap);
	}

	async onInfiniteScroll(e: InfiniteScrollCustomEvent) {
		await this.loadEvents(this.filter, true);
		e.target.complete();
	}

	private async loadEvents(filter: UrlParams, loadMore: boolean = false) {
		if (loadMore) {
			if (this.events().length < this.page * this.pageSize) return;
			this.page++;
		} else {
			this.page = 1;
			this.events.set([]);
		}

		const leaders = this.normalizeFilterValueToArray((filter as any)["leaders"]);

		const dateFilters = this.normalizeFilterValueToArray((filter as any)["year"]);
		const showFuture = dateFilters.includes(this.futureFilterValue);
		const years = dateFilters.filter((value) => value !== this.futureFilterValue).map((year) => parseInt(year, 10));

		const params: SDK.EventsApiListEventsQueryParams = {
			search: filter.search || undefined,
			status: this.normalizeFilterValueToArray((filter as any)["status"]),
			year: years,
			dateFrom: showFuture ? (DateTime.now().startOf("day").toISODate() ?? undefined) : undefined,
			my: leaders.includes("my"),
			noleader: leaders.includes("noleader"),
			deleted: !!filter.deleted,
			sort: (filter as any)["sort"] || this.defaultSortColumn,
			order: (filter as any)["order"] || this.defaultSortOrder(dateFilters),
			offset: (this.page - 1) * this.pageSize,
			limit: this.pageSize,
		};

		const token = ++this.loadToken;

		const events = await this.api.EventsApi.listEvents(params).then((res: any) => res.data);

		if (token !== this.loadToken) return;

		this.events.set(loadMore ? [...this.events(), ...events] : events);
	}

	onRowHover(e: MouseEvent) {
		if (this.previewPaused) return;

		const row = (e.target as HTMLElement | null)?.closest?.("[id^='event-']") as HTMLElement | null;
		if (!row) {
			this.clearHover();
			return;
		}

		const id = Number(row.id.slice("event-".length));
		const event = this.events().find((item) => item.id === id);
		if (!event) return;

		this.positionPreview(e);

		if (this.hoveredEvent()?.id === id || this.pendingEventId === id) return;

		this.hoveredEvent.set(undefined);
		this.pendingEventId = id;
		this.clearTimer();
		this.previewTimer = setTimeout(() => {
			this.pendingEventId = null;
			this.hoveredEvent.set(event);
		}, this.previewDelayMs);
	}

	clearHover() {
		this.clearTimer();
		this.pendingEventId = null;
		this.hoveredEvent.set(undefined);
	}

	private clearTimer() {
		if (this.previewTimer) {
			clearTimeout(this.previewTimer);
			this.previewTimer = null;
		}
	}

	private positionPreview(e: MouseEvent) {
		const cardWidth = 360;
		const offset = 16;
		const margin = 12;

		let left = e.clientX + offset;
		if (left + cardWidth > window.innerWidth) left = Math.max(margin, e.clientX - cardWidth - offset);

		const top = Math.max(margin, Math.min(e.clientY + offset, window.innerHeight - 240));
		this.previewPosition.set({ top, left });
	}

	private getFilterKey(params: Params): string {
		return JSON.stringify(
			Object.keys(params)
				.sort()
				.map((key) => [key, params[key]]),
		);
	}

	private normalizeFilterValueToArray(value: unknown): string[] {
		if (Array.isArray(value)) return value.filter((item) => !!item).map((item) => String(item));
		if (!value) return [];

		return String(value)
			.split(",")
			.map((item) => item.trim())
			.filter((item) => !!item);
	}
}
