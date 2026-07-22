import { CommonModule } from "@angular/common";
import {
	afterNextRender,
	Component,
	computed,
	ElementRef,
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
})
export class EventsListComponent implements OnInit, OnDestroy {
	events = signal<SDK.EventResponseWithLinks[]>([]);
	years = signal<number[]>([]);
	currentYearString = String(new Date().getFullYear());
	selectedYears = signal<string[]>([]);
	selectedStatuses = signal<string[]>([]);
	selectedLeaderFilters = signal<string[]>([]);

	sortColumn = signal<string | null>(null);
	// String, not "ASC" | "DESC": a multi-column sort carries a comma-separated list (e.g. "ASC,DESC").
	sortOrder = signal<string>("ASC");

	readonly sortOptions: SortOption[] = [
		{ key: "name", label: "Název" },
		{ key: "dateFrom", label: "Datum" },
		{ key: "status", label: "Stav" },
	];

	statuses = signal<Record<string, EventStatus>>({});

	// True when the viewport is at least the lg breakpoint (992px) — filters inline vs. in the modal.
	isDesktop = signal(true);

	yearOptions = computed<FilterPillOption[]>(() =>
		this.years().map((year) => ({ value: String(year), label: String(year) })),
	);
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
	private hasAutoScrolled = false;

	filter: UrlParams = {};

	// Row helpers for admin-table (bound as inputs, so keep stable references).
	rowLink = (event: SDK.EventResponseWithLinks) => "" + event.id;
	rowId = (event: SDK.EventResponseWithLinks) => "event-" + event.id;

	// Desktop-only hover preview: the event whose row is currently hovered, plus the
	// floating card's viewport position (anchored next to the mouse cursor).
	hoveredEvent = signal<SDK.EventResponseWithLinks | undefined>(undefined);
	previewPosition = signal<{ top: number; left: number } | null>(null);

	// Show the preview only after the pointer has rested on a row for a moment, so it
	// doesn't flash while sweeping across the list.
	private readonly previewDelayMs = 500;
	private previewTimer: ReturnType<typeof setTimeout> | null = null;
	private pendingEventId: number | null = null;

	private previewOverlay = viewChild<ElementRef<HTMLElement>>("previewOverlay");
	// Hold a direct reference to the relocated overlay: the `previewOverlay` viewChild
	// signal may already be torn down by the time ngOnDestroy runs, which would leave the
	// orphaned <body> node floating over the next page.
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
		// Filters render inline in the toolbar on desktop and inside the filter modal on mobile;
		// this tracks the lg breakpoint (992px) so the template can switch between the two.
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

		// Move the hover-preview overlay to <body> so its fixed positioning is viewport-relative.
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

	ngOnDestroy(): void {
		this.clearTimer();
		// The overlay was relocated to <body>, so Angular won't remove it with the view.
		this.previewOverlayEl?.remove();
		this.previewOverlayEl = null;
	}

	// Header shown above the actions on the mobile ActionSheet.
	rowActionsHeader = (event: SDK.EventResponseWithLinks) => event.name;

	// Arrow property (stable reference + bound `this`) so it can be passed as the
	// admin-table `[actions]` input and invoked from there per row.
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
		if (statusNote === null) return; // user clicked on cancel

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

		// All filter state (year/status/search/leaders) is written to the URL, so drive loading
		// from the query params directly rather than the FilterComponent's `(change)` output
		// (which only emits its own projected controls, and only while the mobile modal is open).
		this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => this.onFilterChange(params));
	}

	onFilterChange(params: Params) {
		this.filter = { ...params };
		this.selectedYears.set(this.normalizeFilterValueToArray(params["year"]));
		this.selectedStatuses.set(this.normalizeFilterValueToArray(params["status"]));
		this.selectedLeaderFilters.set(this.normalizeFilterValueToArray(params["leaders"]));
		this.sortColumn.set(params["sort"] ?? null);
		// Keep the raw param — it may be a comma-separated list of directions for a multi-column sort.
		this.sortOrder.set(params["order"] ?? "ASC");
		this.loadEvents(this.filter);
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

		// If the value is an array from your multi-select, format it for the URL
		if (Array.isArray(value)) {
			// Join it into a string like "2024,2025", or set to null if the array is empty
			formattedValue = value.length > 0 ? value.join(",") : null;
		}

		this.router.navigate([], {
			queryParams: { [name]: formattedValue || null },
			queryParamsHandling: "merge",
			replaceUrl: true,
		});
	}

	toggleCurrentYear() {
		const selectedYears = this.normalizeFilterValueToArray((this.filter as any)["year"]);
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

		const params: SDK.EventsApiListEventsQueryParams = {
			search: filter.search || undefined,
			status: this.normalizeFilterValueToArray((filter as any)["status"]),
			year: this.normalizeFilterValueToArray((filter as any)["year"]).map((year) => parseInt(year, 10)),
			my: leaders.includes("my"),
			noleader: leaders.includes("noleader"),
			deleted: !!filter.deleted,
			sort: (filter as any)["sort"] || undefined,
			order: (filter as any)["order"] || undefined,
			offset: (this.page - 1) * this.pageSize,
			limit: this.pageSize,
		};

		// Guard against out-of-order responses: a slower earlier request (e.g. the initial
		// unfiltered load) must not append its rows on top of a newer filtered result.
		const token = ++this.loadToken;

		const events = await this.api.EventsApi.listEvents(params).then((res: any) => res.data);

		if (token !== this.loadToken) return;

		this.events.set(loadMore ? [...this.events(), ...events] : events);

		if (!loadMore) this.scrollToCurrentDate();
	}

	// On the first load, position the list at the current date, so upcoming events sit above
	// the viewport and past events below. Runs only once per page open so later filter
	// changes don't yank the scroll position.
	private async scrollToCurrentDate() {
		if (this.hasAutoScrolled || this.route.snapshot.fragment) {
			this.hasAutoScrolled = true;
			return;
		}

		const today = DateTime.now().startOf("day");
		const isPastOrToday = (event: SDK.EventResponseWithLinks) => DateTime.fromISO(event.dateFrom) <= today;

		// If the whole first page is future events, keep loading until today appears (capped).
		const maxAutoLoadPages = 5;
		while (this.events().length > 0 && !this.events().some(isPastOrToday) && this.page < maxAutoLoadPages) {
			const lengthBefore = this.events().length;
			await this.loadEvents(this.filter, true);
			if (this.events().length === lengthBefore) break;
		}

		this.hasAutoScrolled = true;

		const boundaryIndex = this.events().findIndex(isPastOrToday);

		// index 0 means there are no future events above, so there is nothing to scroll past
		if (boundaryIndex <= 0) return;

		// Position the scroll in the same render pass that first paints the rows (before the
		// browser paint), so the list appears already scrolled instead of jumping after load.
		const elementId = "event-" + this.events()[boundaryIndex].id;
		afterNextRender(() => this.applyInitialScroll(elementId), { injector: this.injector });
	}

	private applyInitialScroll(elementId: string, framesLeft = 120) {
		const element = document.getElementById(elementId);
		if (!element || !framesLeft) return;

		// Ionic components hydrate asynchronously; until then ion-items have no layout and
		// the target sits collapsed at the top of the list, so scrolling would be a no-op.
		const hydrating =
			element.getBoundingClientRect().height === 0 ||
			(element.tagName.startsWith("ION-") && !element.classList.contains("hydrated"));

		if (hydrating) requestAnimationFrame(() => this.applyInitialScroll(elementId, framesLeft - 1));
		else element.scrollIntoView({ behavior: "instant", block: "center" });
	}

	// Show the event preview card next to the mouse while it rests over a row. Delegated
	// on the table wrapper so it keeps working as rows stream in via infinite scroll.
	onRowHover(e: MouseEvent) {
		const row = (e.target as HTMLElement | null)?.closest?.("[id^='event-']") as HTMLElement | null;
		if (!row) {
			this.clearHover();
			return;
		}

		const id = Number(row.id.slice("event-".length));
		const event = this.events().find((item) => item.id === id);
		if (!event) return;

		this.positionPreview(e);

		// Already shown (or scheduled) for this row: just keep the card following the cursor.
		if (this.hoveredEvent()?.id === id || this.pendingEventId === id) return;

		// Moved onto a different row: restart the delay before revealing its card.
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

		// Prefer the right of the cursor; flip to the left when it would overflow the viewport.
		let left = e.clientX + offset;
		if (left + cardWidth > window.innerWidth) left = Math.max(margin, e.clientX - cardWidth - offset);

		// Sit just below the cursor, clamped so the card stays on screen.
		const top = Math.max(margin, Math.min(e.clientY + offset, window.innerHeight - 240));
		this.previewPosition.set({ top, left });
	}

	private normalizeFilterValueToArray(value: string | string[] | null | undefined): string[] {
		if (Array.isArray(value)) return value.filter((item) => !!item).map((item) => String(item));
		if (!value) return [];

		return String(value)
			.split(",")
			.map((item) => item.trim())
			.filter((item) => !!item);
	}
}
