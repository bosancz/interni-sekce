import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {
	InfiniteScrollCustomEvent,
	IonAvatar,
	IonCheckbox,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonItem,
	IonLabel,
	IonList,
	IonSelect,
	IonSelectOption,
	IonSkeletonText,
} from "@ionic/angular/standalone";
import { EventStatuses } from "src/app/core/config/event-statuses";
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
		IonCheckbox,
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

	statuses = EventStatuses;

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

		this.api.rootLinks.subscribe((rootLinks: RootLinks | null) => this.setActions(rootLinks));

		this.platformService.isPortrait.subscribe((isPortrait: boolean) => {
			this.view = isPortrait ? "list" : "table";
		});
	}

	onFilterChange(filter: UrlParams) {
		this.filter = filter;
		this.loadEvents(filter);
	}

	setFilterParam(name: string, value: string | null) {
		const queryParams: UrlParams = { ...this.route.snapshot.queryParams };
		if (value) queryParams[name] = value;
		else delete queryParams[name];
		this.router.navigate([], { queryParams, replaceUrl: true });
	}

	toggleBooleanFilter(name: string) {
		this.setFilterParam(name, this.filter[name] ? null : "1");
	}

	toggleCurrentYear() {
		this.setFilterParam("year", this.filter["year"] === this.currentYearString ? null : this.currentYearString);
	}

	getLeadersString(event: SDK.EventResponseWithLinks) {
		return event.leaders?.map((item) => item.nickname).join(", ");
	}

	private async loadYears() {
		const years = await this.api.EventsApi.getEventsYears().then((res) => res.data);
		years.sort((a, b) => b - a);
		
		this.years.set(years);
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

		const params: SDK.EventsApiListEventsQueryParams = {
			search: filter.search || undefined,
			status: filter.status || undefined,
			year: filter.year ? parseInt(filter.year) : undefined,
			my: !!filter.my,
			noleader: !!filter.noleader,
			deleted: !!filter.deleted,
			offset: (this.page - 1) * this.pageSize,
			limit: this.pageSize,
		};

		const events = await this.api.EventsApi.listEvents(params).then((res: any) => res.data);

		this.events.set([...this.events(), ...events]);
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
