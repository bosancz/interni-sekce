import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { InfiniteScrollCustomEvent, Platform } from "@ionic/angular";
import { EventResponseWithLinks, EventsApiListEventsQueryParams } from "src/app/api";
import { EventStatuses } from "src/app/config/event-statuses";
import { ApiEndpoints, ApiService } from "src/app/services/api.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { UrlParams } from "src/helpers/typings";

@Component({
  selector: "bo-events-list",
  templateUrl: "./events-list.component.html",
  styleUrls: ["./events-list.component.scss"],
})
export class EventsListComponent implements OnInit {
  events?: EventResponseWithLinks[];

  years: number[] = [];
  statuses = EventStatuses;

  actions: Action[] = [];

  page = 1;
  readonly pageSize = 50;

  filter: UrlParams = {};

  view?: "table" | "list";

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private platform: Platform,
  ) {}

  ngOnInit(): void {
    this.loadYears();

    this.api.endpoints.subscribe((endpoints) => this.setActions(endpoints));

    this.updateView();
    this.platform.resize.subscribe(() => this.updateView());
  }

  updateView() {
    this.view = this.platform.isPortrait() ? "list" : "table";
  }

  onFilterChange(filter: UrlParams) {
    this.filter = filter;
    this.loadEvents(filter);
  }

  createEvent() {
    this.router.navigate(["vytvorit"], { relativeTo: this.route });
  }

  getLeadersString(event: EventResponseWithLinks) {
    return event.leaders?.map((item) => item.nickname).join(", ");
  }

  private async loadYears() {
    this.years = await this.api.events.getEventsYears().then((res) => res.data);
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

    const params: EventsApiListEventsQueryParams = {
      search: filter.search || undefined,
      status: filter.status || undefined,
      year: filter.year ? parseInt(filter.year) : undefined,
      my: !!filter.my,
      noleader: !!filter.noleader,
      offset: (this.page - 1) * this.pageSize,
      limit: this.pageSize,
    };

    const events = await this.api.events.listEvents(params).then((res) => res.data);

    if (!this.events) this.events = [];
    this.events.push(...events);
  }

  private setActions(endpoints: ApiEndpoints | null) {
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
