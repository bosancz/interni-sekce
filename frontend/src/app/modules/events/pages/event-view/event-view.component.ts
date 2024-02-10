import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ViewWillEnter, ViewWillLeave } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EventResponseWithLinks, EventUpdateBody } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { ModalService } from "src/app/services/modal.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { ExtractExisting } from "src/helpers/typings";

export type EventStatusActions = ExtractExisting<
  keyof EventResponseWithLinks["_links"],
  "publishEvent" | "unpublishEvent" | "uncancelEvent" | "cancelEvent" | "rejectEvent" | "submitEvent"
>;

@UntilDestroy()
@Component({
  selector: "bo-event-view",
  templateUrl: "./event-view.component.html",
  styleUrl: "./event-view.component.scss",
})
export class EventViewComponent implements ViewWillEnter, ViewWillLeave {
  event: any;

  actions: Action[] = [];

  view?: "info" | "attendees" | "accounting" | "registration" | "report";

  constructor(
    private readonly api: ApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toastService: ToastService,
    private readonly modalService: ModalService,
  ) {}

  ionViewWillEnter(): void {
    this.route.params
      .pipe(untilDestroyed(this, "ionViewWillLeave"))
      .subscribe((params) => this.loadEvent(parseInt(params.event)));
  }

  ionViewWillLeave(): void {}

  async updateEvent(data: Partial<EventUpdateBody>) {
    if (!this.event) return;

    try {
      Object.assign(this.event, data);
      await this.api.events.updateEvent(this.event.id, data);
      this.toastService.toast("Uloženo.");
    } catch (e) {
      this.toastService.toast("Nepodařilo se uložit změny.", { color: "warning" });
    }

    await this.loadEvent(this.event.id);
  }

  private async loadEvent(eventId: number) {
    this.event = await this.api.events.getEvent(eventId).then((res) => res.data);

    this.setActions(this.event);
  }

  async leadEvent(event: EventResponseWithLinks) {
    await this.api.events.leadEvent(event.id);

    await this.loadEvent(event.id);

    this.toastService.toast("Uloženo");
  }

  private async eventStatusAction(event: EventResponseWithLinks, action: EventStatusActions) {
    if (!event._links[action].allowed) {
      this.toastService.toast("K této akci nemáš oprávnění.");
      return;
    }

    const statusNote = window.prompt("Poznámka ke změně stavu (můžeš nechat prázdné):");
    if (statusNote === null) return; // user clicked on cancel

    await this.api.events[action](event.id, { statusNote });

    await this.loadEvent(event.id);

    this.toastService.toast("Uloženo");
  }

  private async deleteEvent(event: EventResponseWithLinks) {
    const confirmation = await this.modalService.deleteConfirmationModal(`Opravdu chcete smazat akci ${event.name}?`);

    if (confirmation) {
      await this.api.events.deleteEvent(event.id);
      this.router.navigate(["/akce"], { relativeTo: this.route, replaceUrl: true });
      this.toastService.toast("Akce smazána");
    }
  }

  private setActions(event: EventResponseWithLinks) {
    this.actions = [
      {
        text: "Vést akci",
        color: "success",
        icon: "hand-left-outline",
        hidden: !event._links.leadEvent.allowed,
        handler: () => this.leadEvent(event),
      },
      {
        text: "Ke schválení",
        icon: "arrow-forward-outline",
        color: "primary",
        hidden: !event?._links.submitEvent.allowed,
        handler: () => this.eventStatusAction(event, "submitEvent"),
      },
      {
        text: "Do programu",
        icon: "arrow-forward-outline",
        color: "primary",
        hidden: !event?._links.publishEvent.allowed,
        handler: () => this.eventStatusAction(event, "publishEvent"),
      },
      {
        text: "Vrátit k úpravám",
        icon: "arrow-back-outline",
        color: "danger",
        hidden: !event?._links.rejectEvent.allowed,
        handler: () => this.eventStatusAction(event, "rejectEvent"),
      },
      {
        text: "Odebrat z programu",
        icon: "arrow-back-outline",
        color: "danger",
        hidden: !event?._links.unpublishEvent.allowed,
        handler: () => this.eventStatusAction(event, "unpublishEvent"),
      },
      {
        text: "Označit jako zrušenou",
        color: "danger",
        icon: "arrow-back-outline",
        hidden: !event?._links.cancelEvent.allowed,
        handler: () => this.eventStatusAction(event, "cancelEvent"),
      },
      {
        text: "Odzrušit",
        icon: "arrow-forward-outline",
        hidden: !event?._links.uncancelEvent.allowed,
        handler: () => this.eventStatusAction(event, "uncancelEvent"),
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
