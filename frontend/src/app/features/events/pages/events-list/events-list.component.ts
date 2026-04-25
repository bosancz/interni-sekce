import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {
	InfiniteScrollCustomEvent,
	IonAvatar,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonItem,
	IonLabel,
	IonList,
	IonSelect,
	IonSelectOption,
	IonSkeletonText,
} from "@ionic/angular/standalone";
import { EventStatus, EventStatusID, EventStatuses } from "src/app/core/config/event-statuses";
import { ApiService, RootLinks } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AdminTableComponent } from "src/app/shared/components/admin-table/admin-table.component";
import { EventStatusBadgeComponent } from "src/app/shared/components/event-status-badge/event-status-badge.component";
import { FilterComponent } from "src/app/shared/components/filter/filter.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { UrlParams } from "src/helpers/typings";
import { SDK } from "src/sdk";
import { EventPipe } from "../../../../shared/pipes/event.pipe";
import { GroupPipe } from "../../../../shared/pipes/group.pipe";
import { MemberPipe } from "../../../../shared/pipes/member.pipe";
import { EventCreateModalComponent } from "../../components/event-create-modal/event-create-modal.component";

@Component({
	selector: "bo-events-list",
	templateUrl: "./events-list.component.html",
	styleUrls: ["./events-list.component.scss"],

	imports: [
		CommonModule,
		RouterLink,
		FormsModule,
		IonList,
		IonItem,
		IonSkeletonText,
		IonLabel,
		IonAvatar,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		IonSelect,
		IonSelectOption,
		EventStatusBadgeComponent,
		GroupPipe,
		MemberPipe,
		AdminTableComponent,
		EventPipe,
		PageContentComponent,
		PageHeaderComponent,
		FilterComponent,
	],
})
export class EventsListComponent implements OnInit {
	events = signal<SDK.EventResponseWithLinks[]>([]);
	years = signal<number[]>([]);
	actions = signal<Action[]>([]);
	currentYearString = String(new Date().getFullYear());
	selectedYears: string[] = [];
	selectedStatuses: string[] = [];
	selectedLeaderFilters: string[] = [];

	statuses = signal<Record<string, EventStatus>>({});

	page = 1;
	readonly pageSize = 50;

	filter: UrlParams = {};

	view?: "table" | "list";

	constructor(
		private api: ApiService,
		private platformService: PlatformService,
		private modalService: ModalService,
		private toastService: ToastService,
		private router: Router,
		private route: ActivatedRoute,
	) {}

	ngOnInit(): void {
		this.loadYears();
		this.loadStatuses();

		this.api.rootLinks.subscribe((rootLinks: RootLinks | null) => this.setActions(rootLinks));

		this.platformService.isPortrait.subscribe((isPortrait: boolean) => {
			this.view = isPortrait ? "list" : "table";
		});
	}

	onFilterChange(filter: UrlParams) {
		this.filter = filter;
		this.selectedYears = this.normalizeFilterValueToArray((filter as any)["year"]);
		this.selectedStatuses = this.normalizeFilterValueToArray((filter as any)["status"]);
		this.selectedLeaderFilters = [
			...(filter.my ? ["my"] : []),
			...(filter.noleader ? ["noleader"] : []),
		];
		this.loadEvents(filter);
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

	setLeaderFilter(selectedValues: string[] | string | null) {
		const values = Array.isArray(selectedValues)
			? selectedValues
			: selectedValues
				? [selectedValues]
				: [];

		const isMySelected = values.includes("my");
		const isNoLeaderSelected = values.includes("noleader");

		this.router.navigate([], {
			queryParams: {
				my: isMySelected ? "1" : null,
				noleader: isNoLeaderSelected ? "1" : null,
			},
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
			if (this.events && this.events.length < this.page * this.pageSize) return;
			this.page++;
		} else {
			this.page = 1;
			this.events.set([]);
		}

		const params: SDK.SDKEventsApiListEventsQueryMultipleParams = {
			search: filter.search || undefined,
			status: this.normalizeFilterValueToArray((filter as any)["status"]),
			year: this.normalizeFilterValueToArray((filter as any)["year"]).map((year) => parseInt(year, 10)),
			my: !!filter.my,
			noleader: !!filter.noleader,
			deleted: !!filter.deleted,
			offset: (this.page - 1) * this.pageSize,
			limit: this.pageSize,
		};

		const events = await this.api.EventsApi.listEvents(params).then((res: any) => res.data);

		this.events.set([...this.events(), ...events]);
	}

	private normalizeFilterValueToArray(value: string | string[] | null | undefined): string[] {
		if (Array.isArray(value)) return value.filter((item) => !!item).map((item) => String(item));
		if (!value) return [];

		return String(value)
			.split(",")
			.map((item) => item.trim())
			.filter((item) => !!item);
	}


	private async createEvent() {
		const data = await this.modalService.componentModal(EventCreateModalComponent);

		if (!data) return;

		// create the event and wait for confirmation
		let event = await this.api.EventsApi.createEvent(data).then((res: any) => res.data);
		// show the confrmation
		this.toastService.toast("Akce vytvořena a uložena.");
		// open the event
		this.router.navigate(["/akce/" + event.id]);
	}

	private setActions(rootLinks: RootLinks | null) {
		this.actions.set([
			{
				icon: "add-outline",
				pinned: true,
				text: "Přidat",
				disabled: !rootLinks?.createEvent.allowed, 
				hidden: !rootLinks?.createEvent.applicable,
				handler: () => this.createEvent(),
			},
		]);
	}
}
