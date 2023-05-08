import { Component, OnDestroy, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EventAttendeeResponse, EventResponse, MemberResponse } from "src/app/api";
import { MemberSelectorModalComponent } from "src/app/modules/events/components/member-selector-modal/member-selector-modal.component";
import { EventsService } from "src/app/modules/events/services/events.service";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@UntilDestroy()
@Component({
  selector: "bo-events-view-attendees",
  templateUrl: "./events-view-attendees.component.html",
  styleUrls: ["./events-view-attendees.component.scss"],
})
export class EventsViewAttendeesComponent implements OnInit, OnDestroy {
  event?: EventResponse;

  attendees: EventAttendeeResponse[] = [];

  actions: Action[] = [];

  modal?: HTMLIonModalElement;

  constructor(
    private eventsService: EventsService,
    private api: ApiService,
    public modalController: ModalController,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.eventsService.event$.pipe(untilDestroyed(this)).subscribe((event) => {
      this.event = event || undefined;
      this.attendees = event?.attendees || [];

      this.sortAttendees();

      this.setActions(this.event);
    });
  }

  ngOnDestroy() {
    this.modal?.dismiss();
  }

  private sortAttendees() {
    this.attendees.sort((a, b) => {
      const aString = a.member?.nickname || a.member?.firstName || a.member?.lastName || "";
      const bString = b.member?.nickname || b.member?.firstName || b.member?.lastName || "";
      return aString.localeCompare(bString);
    });
  }

  async addAttendeeModal() {
    this.modal = await this.modalController.create({
      component: MemberSelectorModalComponent,
    });

    this.modal.onWillDismiss().then((ev) => {
      if (ev.data?.member) this.addAttendee(ev.data?.member);
    });

    return await this.modal.present();
  }

  private async addAttendee(member: MemberResponse) {
    if (!this.event) return;

    const attendees = this.event.attendees || [];

    if (attendees.some((item) => item.member && item.member.id === member.id)) {
      this.toastService.toast("Účastník už v seznamu je.");
      return;
    }

    // optimistic update
    attendees.push({
      memberId: member.id,
      member,
      eventId: this.event.id,
      type: "attendee",
    });

    this.attendees = attendees;
    this.sortAttendees();

    await this.api.events.addEventAttendee(this.event.id, member.id, {});

    await this.eventsService.loadEvent(this.event.id);
  }

  async removeAttendee(attendee: EventAttendeeResponse) {
    if (!this.event) return;

    let attendees = this.event.attendees || [];
    attendees = attendees.filter((item) => item.memberId !== attendee.memberId);

    this.attendees = attendees; // optimistic update

    await this.api.events.deleteEventAttendee(this.event.id, attendee.memberId);

    await this.eventsService.loadEvent(this.event.id);
  }

  toggleSliding(sliding: any) {
    sliding.getOpenAmount().then((open: number) => {
      if (open) sliding.close();
      else sliding.open();
    });
  }

  private async exportExcel(event: EventResponse) {
    // TODO:
    // if (event._links.["announcement-template"]) {
    //   const url = environment.apiRoot + event._links.["announcement-template"].href;
    //   window.open(url);
    // }
  }

  private setActions(event?: EventResponse) {
    this.actions = [
      {
        text: "Přidat",
        icon: "add-outline",
        pinned: true,
        hidden: !event?._links.addEventAttendee.allowed,
        handler: () => this.addAttendeeModal(),
      },
      {
        text: "Stáhnout ohlášku",
        icon: "download-outline",
        // hidden: !event?._links.self.allowed.GET, // TODO:
        handler: () => this.exportExcel(event!),
      },
    ];
  }
}