import { Component, OnInit } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EventResponse } from "src/app/api";
import { EventsService } from "src/app/modules/events/services/events.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@UntilDestroy()
@Component({
  selector: "bo-events-view-report",
  templateUrl: "./events-view-report.component.html",
  styleUrls: ["./events-view-report.component.scss"],
})
export class EventsViewReportComponent implements OnInit {
  event?: EventResponse;

  actions: Action[] = [];

  constructor(private eventsService: EventsService) {}

  ngOnInit(): void {
    this.eventsService.event$.pipe(untilDestroyed(this)).subscribe((event) => (this.event = event));
  }
}