import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ViewWillEnter } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
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
  page = 1;
  pages = 1;

  years: number[] = [];
  statuses = EventStatuses;

  actions: Action[] = [];

  loadingArray = Array(5).fill(null);
  showFilters = false;

  constructor(private api: ApiService, private router: Router, private route: ActivatedRoute) {}

  ionViewWillEnter(): void {
    this.loadYears();

    // TODO: use ionWillLeave?
    this.api.endpoints.pipe(untilDestroyed(this)).subscribe((endpoints) => this.setActions(endpoints));
  }

  async loadYears() {
    this.years = await this.api.events.getEventsYears().then((res) => res.data);
    this.years.sort((a, b) => b - a);
  }

  async loadEvents(filter: any) {
    this.events = undefined;

    const events = await this.api.events
      .listEvents(filter.year || null, filter.status || null, filter.search || null)
      .then((res) => res.data);

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

  getLeadersString(event: EventResponse) {
    return event.leaders?.map((item) => item.nickname).join(", ");
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
