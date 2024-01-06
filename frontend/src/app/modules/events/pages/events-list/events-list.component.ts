import { Component } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { InfiniteScrollCustomEvent, ViewWillEnter, ViewWillLeave } from "@ionic/angular";
import { untilDestroyed } from "@ngneat/until-destroy";
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
export class EventsListComponent implements ViewWillEnter, ViewWillLeave {
  events?: EventResponseWithLinks[];

  years: number[] = [];
  statuses = EventStatuses;

  actions: Action[] = [];

  page = 1;
  readonly pageSize = 50;

  filterForm = new FormGroup({
    search: new FormControl<string | null>(null),
    status: new FormControl<string | null>(null),
    year: new FormControl<number | null>(null),
  });

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ionViewWillEnter(): void {
    this.loadYears();

    this.route.queryParams
      .pipe(untilDestroyed(this, "ionViewWillLeave"))
      .subscribe((queryParams) => this.onParamsChange(queryParams));

    this.api.endpoints
      .pipe(untilDestroyed(this, "ionViewWillLeave"))
      .subscribe((endpoints) => this.setActions(endpoints));
  }

  ionViewWillLeave(): void {}

  async onInfiniteScroll(e: InfiniteScrollCustomEvent) {
    await this.loadNextPage();
    e.target.complete();
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

  private async loadFirstPage() {
    this.events = await this.loadEvents(0, this.pageSize);
  }

  private async loadNextPage() {
    if (this.events && this.events.length < this.page * this.pageSize) return;
    const events = await this.loadEvents((this.page - 1) * this.pageSize, this.page * this.pageSize);
    if (!this.events) this.events = [];
    this.events.push(...events);
  }

  private onParamsChange(queryParams: UrlParams) {
    console.log(queryParams);
    this.setFilter(queryParams);
    this.loadFirstPage();
  }

  private setFilter(data: UrlParams) {
    this.filterForm.setValue({
      search: data.search || null,
      status: data.status || null,
      year: data.year ? parseInt(data.year) : null,
    });
  }

  private async loadEvents(offset: number, limit: number) {
    const filter = this.filterForm.value;

    const params: EventsApiListEventsQueryParams = {
      search: filter.search || undefined,
      status: filter.status || undefined,
      year: filter.year || undefined,
      offset,
      limit,
    };

    return this.api.events.listEvents(params).then((res) => res.data);
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
