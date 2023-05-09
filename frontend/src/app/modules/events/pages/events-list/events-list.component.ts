import { Component, ViewChild } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ViewWillEnter } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DateTime } from "luxon";
import { BehaviorSubject } from "rxjs";
import { EventResponse } from "src/app/api";
import { EventStatuses } from "src/app/config/event-statuses";
import { ApiEndpoints, ApiService } from "src/app/services/api.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

type EventWithSearchString = EventResponse & { searchString: string };

@UntilDestroy()
@Component({
  selector: "bo-events-list",
  templateUrl: "./events-list.component.html",
  styleUrls: ["./events-list.component.scss"],
})
export class EventsListComponent implements ViewWillEnter {
  events?: EventWithSearchString[];
  filteredEvents?: EventResponse[];

  years: number[] = [];
  currentYear?: number;

  statuses = EventStatuses;

  @ViewChild("filterForm", { static: true }) filterForm!: NgForm;

  showFilter: boolean = false;

  search$ = new BehaviorSubject<string>("");

  actions: Action[] = [];

  loadingArray = Array(5).fill(null);

  constructor(private api: ApiService, private router: Router, private route: ActivatedRoute) {}

  ionViewWillEnter(): void {
    this.loadYears();

    // TODO: use ionWillLeave?
    this.api.endpoints.pipe(untilDestroyed(this)).subscribe((endpoints) => this.setActions(endpoints));

    if (this.filterForm) this.loadEvents(this.filterForm.value);
  }

  ngAfterViewInit() {
    this.filterForm.valueChanges!.subscribe((filter) => {
      this.loadEvents(filter);
    });
  }

  async loadYears() {
    this.years = await this.api.events.getEventsYears().then((res) => res.data);
    this.years.sort((a, b) => b - a);

    const thisYear = DateTime.local().year;
    if (this.years.indexOf(thisYear) !== -1) this.currentYear = thisYear;
    else this.currentYear = this.years[0];
  }

  async loadEvents(filter: any) {
    if (!filter.year) {
      this.events = [];
      return;
    }

    this.events = undefined;

    const options: any = {
      sort: "dateFrom",
    };

    options.filter = {
      dateTill: { $gte: DateTime.local().set({ year: filter.year, month: 1, day: 1 }).toISODate() },
      dateFrom: { $lte: DateTime.local().set({ year: filter.year, month: 12, day: 31 }).toISODate() },
    };

    if (filter.status) options.filter.status = filter.status;

    // TODO: implements options above
    const events = await this.api.events.listEvents().then((res) => res.data);

    const eventsWithSearchString = events.map((event) => {
      const searchString = [event.name, event.place, event.leaders?.map((member) => member.nickname).join(" ")]
        .filter((item) => !!item)
        .join(" ");
      return { ...event, searchString };
    });

    this.events = eventsWithSearchString;
  }

  createEvent() {
    this.router.navigate(["vytvorit"], { relativeTo: this.route });
  }

  private filterEvents(events: EventWithSearchString[], search: string) {
    if (!search) return events;

    const search_re = new RegExp("(^| )" + search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    return events.filter((event) => search_re.test(event.searchString));
  }

  getLeadersString(event: EventResponse) {
    return event.leaders?.map((item) => item.nickname).join(", ");
  }

  private setActions(endpoints: ApiEndpoints | null) {
    this.actions = [
      {
        icon: "filter-outline",
        pinned: true,
        handler: () => (this.showFilter = !this.showFilter),
      },
      {
        icon: "add-outline",
        pinned: true,
        text: "Přidat",
        hidden: endpoints?.createEvent.allowed,
        handler: () => this.createEvent(),
      },
    ];
  }
}
