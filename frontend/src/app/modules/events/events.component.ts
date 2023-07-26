import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";
import { NavController } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { filter } from "rxjs/operators";
import { EventResponseWithLinks } from "src/app/api";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { EventsService } from "./services/events.service";

@UntilDestroy()
@Component({
  selector: "bo-events",
  templateUrl: "./events.component.html",
  styleUrls: ["./events.component.scss"],
})
export class EventsComponent implements OnInit {
  event?: EventResponseWithLinks;

  actions: Action[] = [];

  constructor(
    private route: ActivatedRoute,
    private eventsService: EventsService,
    private navController: NavController,
    private toastService: ToastService,
  ) {}

  ngOnInit() {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params: Params) => this.loadEvent(params.event));

    this.eventsService.event$.pipe(filter((event) => !!event)).subscribe((event) => (this.event = event));
  }

  async loadEvent(eventId: number) {
    try {
      await this.eventsService.loadEvent(eventId);
    } catch (err) {
      this.navController.navigateBack("/akce");
      this.toastService.toast("Akce nebyla nalezena, zobrazuji přehled akcí.");
    }
  }
}
