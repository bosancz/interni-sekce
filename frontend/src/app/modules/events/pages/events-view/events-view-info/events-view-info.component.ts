import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertController } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { filter } from "rxjs/operators";
import { EventResponse } from "src/app/api";
import { EventStatuses } from "src/app/config/event-statuses";
import { Album, Photo } from "src/app/schema/album";
import { EventActions } from "src/app/schema/event";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { EventsService } from "../../../services/events.service";

@UntilDestroy()
@Component({
  selector: "bo-events-view-info",
  templateUrl: "./events-view-info.component.html",
  styleUrls: ["./events-view-info.component.scss"],
})
export class EventsViewInfoComponent implements OnInit, OnDestroy {
  event?: EventResponse;

  eventAlbum?: Album<Photo>;

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

  async updateEvent(event: EventResponse) {
    this.event = event;

    this.actions = this.getActions(this.event);
  }

  async deleteEvent(event: EventResponse) {
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

  async deleteEventConfirmed(event: EventResponse) {
    await this.eventsService.deleteEvent(event.id);

    this.router.navigate(["/akce"], { relativeTo: this.route, replaceUrl: true });
    this.toastService.toast("Akce smazána");
  }

  async eventAction(event: EventResponse, action: EventActions) {
    if (!event._links.[action].allowed) {
      this.toastService.toast("K této akci nemáš oprávnění.");
      return;
    }

    let note: string | null = null;

    if (action !== "lead") {
      note = window.prompt("Poznámka ke změně stavu (můžeš nechat prázdné):");
      if (note === null) return; // user clicked on cancel
    }

    await this.api.post(event._actions[action], { note: note || undefined });

    await this.eventsService.loadEvent(event.id);

    this.toastService.toast("Uloženo");
  }

  private getActions(event: EventResponse): Action[] {
    return [
      {
        text: "Vést akci",
        color: "success",
        icon: "hand-left-outline",
        hidden: !event._links.lead,
        handler: () => this.eventAction(event, "lead"),
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
        handler: () => this.eventAction(event, "submit"),
      },
      {
        text: "Do programu",
        icon: "arrow-forward-outline",
        color: "primary",
        hidden: !event?._links.publishEvent.allowed,
        handler: () => this.eventAction(event, "publish"),
      },
      {
        text: "Vrátit k úpravám",
        icon: "arrow-back-outline",
        color: "danger",
        hidden: !event?._links.rejectEvent.allowed,
        handler: () => this.eventAction(event, "reject"),
      },
      {
        text: "Odebrat z programu",
        icon: "arrow-back-outline",
        color: "danger",
        hidden: !event?._links.unpublishEvent.allowed,
        handler: () => this.eventAction(event, "unpublish"),
      },
      {
        text: "Označit jako zrušenou",
        color: "danger",
        icon: "arrow-back-outline",
        hidden: !event?._links.cancelEvent.allowed,
        handler: () => this.eventAction(event, "cancel"),
      },
      {
        text: "Odzrušit",
        icon: "arrow-forward-outline",
        hidden: !event?._links.uncancelEvent.allowed,
        handler: () => this.eventAction(event, "uncancel"),
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
