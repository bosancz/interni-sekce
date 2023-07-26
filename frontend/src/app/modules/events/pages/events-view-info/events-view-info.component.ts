import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertController } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { filter } from "rxjs/operators";
import { AlbumResponseWithLinks, EventResponseWithLinks } from "src/app/api";
import { EventStatuses } from "src/app/config/event-statuses";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { EventActions } from "../../schema/event-actions";
import { EventsService } from "../../services/events.service";

@UntilDestroy()
@Component({
  selector: "bo-events-view-info",
  templateUrl: "./events-view-info.component.html",
  styleUrls: ["./events-view-info.component.scss"],
})
export class EventsViewInfoComponent implements OnInit, OnDestroy {
  event?: EventResponseWithLinks;

  eventAlbum?: AlbumResponseWithLinks;

  actions: Action[] = [];

  view: "event" | "attendees" | "accounting" | "registration" | "report" = "event";

  statuses = EventStatuses;

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private eventsService: EventsService,
    private alertConctroller: AlertController,
  ) {}

  ngOnInit() {
    this.eventsService.event$
      .pipe(untilDestroyed(this))
      .pipe(filter((event) => !!event))
      .subscribe((event) => this.updateEvent(event!));
  }

  ngOnDestroy() {}

  async updateEvent(event: EventResponseWithLinks) {
    this.event = event;

    this.actions = this.getActions(this.event);
  }

  async deleteEvent(event: EventResponseWithLinks) {
    const alert = await this.alertConctroller.create({
      header: "Smazat akci?",
      message: `Opravdu chcete smazat akci ${event.name}?`,
      buttons: [
        { text: "Zrušit", role: "cancel" },
        { text: "Smazat", handler: () => this.deleteEventConfirmed(event) },
      ],
    });

    await alert.present();
  }

  async deleteEventConfirmed(event: EventResponseWithLinks) {
    await this.eventsService.deleteEvent(event.id);

    this.router.navigate(["/akce"], { relativeTo: this.route, replaceUrl: true });
    this.toastService.toast("Akce smazána");
  }

  async leadEvent(event: EventResponseWithLinks) {
    await this.api.events.leadEvent(event.id);

    await this.eventsService.loadEvent(event.id);

    this.toastService.toast("Uloženo");
  }

  async eventAction(event: EventResponseWithLinks, action: EventActions) {
    if (!event._links[action].allowed) {
      this.toastService.toast("K této akci nemáš oprávnění.");
      return;
    }

    const statusNote = window.prompt("Poznámka ke změně stavu (můžeš nechat prázdné):");
    if (statusNote === null) return; // user clicked on cancel

    await this.api.events[action](event.id, { statusNote });

    await this.eventsService.loadEvent(event.id);

    this.toastService.toast("Uloženo");
  }

  private getActions(event: EventResponseWithLinks): Action[] {
    return [
      {
        text: "Vést akci",
        color: "success",
        icon: "hand-left-outline",
        hidden: !event._links.leadEvent.allowed,
        handler: () => this.leadEvent(event),
      },
      {
        text: "Upravit",
        pinned: true,
        icon: "create-outline",
        hidden: !event._links.updateEvent.allowed,
        handler: () => this.router.navigate(["../upravit"], { relativeTo: this.route }),
      },
      {
        text: "Ke schválení",
        icon: "arrow-forward-outline",
        color: "primary",
        hidden: !event?._links.submitEvent.allowed,
        handler: () => this.eventAction(event, "submitEvent"),
      },
      {
        text: "Do programu",
        icon: "arrow-forward-outline",
        color: "primary",
        hidden: !event?._links.publishEvent.allowed,
        handler: () => this.eventAction(event, "publishEvent"),
      },
      {
        text: "Vrátit k úpravám",
        icon: "arrow-back-outline",
        color: "danger",
        hidden: !event?._links.rejectEvent.allowed,
        handler: () => this.eventAction(event, "rejectEvent"),
      },
      {
        text: "Odebrat z programu",
        icon: "arrow-back-outline",
        color: "danger",
        hidden: !event?._links.unpublishEvent.allowed,
        handler: () => this.eventAction(event, "unpublishEvent"),
      },
      {
        text: "Označit jako zrušenou",
        color: "danger",
        icon: "arrow-back-outline",
        hidden: !event?._links.cancelEvent.allowed,
        handler: () => this.eventAction(event, "cancelEvent"),
      },
      {
        text: "Odzrušit",
        icon: "arrow-forward-outline",
        hidden: !event?._links.uncancelEvent.allowed,
        handler: () => this.eventAction(event, "uncancelEvent"),
      },
      {
        text: "Smazat",
        role: "destructive",
        color: "danger",
        icon: "trash-outline",
        hidden: !event._links.deleteEvent.allowed,
        handler: () => this.deleteEvent(event),
      },
    ];
  }
}
