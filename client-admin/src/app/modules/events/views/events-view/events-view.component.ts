import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from "@angular/router";
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EventStatuses } from "app/config/event-statuses";
import { Event } from "app/schema/event";
import { Action } from 'app/shared/components/action-buttons/action-buttons.component';
import { filter } from 'rxjs/operators';
import { EventsService } from '../../services/events.service';


@UntilDestroy()
@Component({
  selector: 'bo-events-view',
  templateUrl: './events-view.component.html',
  styleUrls: ['./events-view.component.scss'],
})
export class EventsViewComponent implements OnInit {

  event?: Event;

  actions: Action[] = [];

  constructor(
    private route: ActivatedRoute,
    private eventsService: EventsService
  ) { }

  ngOnInit() {
    this.route.params
      .pipe(untilDestroyed(this))
      .subscribe((params: Params) => this.loadEvent(params.event));

    this.eventsService.event$
      .pipe(filter(event => !!event))
      .subscribe(event => this.event = event);
  }

  async loadEvent(eventId: string) {
    await this.eventsService.loadEvent(eventId);
  }

}
