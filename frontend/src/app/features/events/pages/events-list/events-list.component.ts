import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import {
    InfiniteScrollCustomEvent,
    IonAvatar,
    IonButton,
    IonButtons,
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
import { ApiService, RootLinks } from "src/app/services/api.service";
import { ModalService } from "src/app/services/modal.service";
import { PlatformService } from "src/app/services/platform.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { UrlParams } from "src/helpers/typings";
import { SDK } from "src/sdk";
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
		IonButton,
		IonButtons,
		IonSelect,
		IonSelectOption,
		IonCheckbox,
	],
})
export class EventsListComponent implements OnInit {
	events?: SDK.EventResponseWithLinks[];

	years: number[] = [];
	statuses = EventStatuses;

	actions: Action[] = [];

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
	) {}

	ngOnInit(): void {
		this.loadYears();

		this.api.rootLinks.subscribe((endpoints) => this.setActions(endpoints));

		this.platformService.isPortrait.subscribe((isPortrait) => {
			this.view = isPortrait ? "list" : "table";
		});
	}

	onFilterChange(filter: UrlParams) {
		this.filter = filter;
		this.loadEvents(filter);
	}

	getLeadersString(event: SDK.EventResponseWithLinks) {
		return event.leaders?.map((item) => item.nickname).join(", ");
	}

	private async loadYears() {
		this.years = await this.api.EventsApi.getEventsYears().then((res) => res.data);
		this.years.sort((a, b) => b - a);
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
			this.events = undefined;
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

		const events = await this.api.EventsApi.listEvents(params).then((res) => res.data);

		if (!this.events) this.events = [];
		this.events.push(...events);
	}

	private async createEvent() {
		const data = await this.modalService.componentModal(EventCreateModalComponent);

		if (!data) return;

		// create the event and wait for confirmation
		let event = await this.api.EventsApi.createEvent(data).then((res) => res.data);
		// show the confrmation
		this.toastService.toast("Akce vytvořena a uložena.");
		// open the event
		this.router.navigate(["/akce/" + event.id]);
	}

	private setActions(endpoints: RootLinks | null) {
		console.log(endpoints);
		this.actions = [
			{
				icon: "add-outline",
				pinned: true,
				text: "Přidat",
				hidden: !endpoints?.createEvent.allowed,
				handler: () => this.createEvent(),
			},
		];
	}
}
