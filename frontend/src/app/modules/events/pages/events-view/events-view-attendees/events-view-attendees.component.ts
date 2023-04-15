import { Component, OnDestroy, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EventResponse, MemberResponse } from "src/app/api";
import { MemberSelectorModalComponent } from "src/app/modules/events/components/member-selector-modal/member-selector-modal.component";
import { EventsService } from "src/app/modules/events/services/events.service";
import { Event } from "src/app/schema/event";
import { Member } from "src/app/schema/member";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { environment } from "src/environments/environment";

@UntilDestroy()
@Component({
  selector: "bo-events-view-attendees",
  templateUrl: "./events-view-attendees.component.html",
  styleUrls: ["./events-view-attendees.component.scss"],
})
export class EventsViewAttendeesComponent implements OnInit, OnDestroy {
  event?: EventResponse;

  attendees: EventAttendeResponse[] = [];

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
      this.leaders = event?.leaders || [];

      this.sortAttendees();

      this.setActions(this.event);
    });
  }

  ngOnDestroy() {
    this.modal?.dismiss();
  }

  private sortAttendees() {
    this.attendees.sort((a, b) => {
      const aString = a.nickname || a.name?.first || a.name?.last || "";
      const bString = b.nickname || b.name?.first || b.name?.last || "";
      return aString.localeCompare(bString);
    });
  }

  async addAttendeeModal() {
    const members = await this.api.get("members");

    this.modal = await this.modalController.create({
      component: MemberSelectorModalComponent,
      componentProps: { members },
    });

    this.modal.onWillDismiss().then((ev) => {
      if (ev.data?.member) this.addAttendee(ev.data?.member);
    });

    return await this.modal.present();
  }

  private async addAttendee(member: MemberResponse) {
    if (!this.event) return;

    const attendees = this.event.attendees || [];

    if (attendees.findIndex((item) => item.id === member._id) !== -1) {
      this.toastService.toast("Účastník už v seznamu je.");
      return;
    }

     // optimistic update
    attendees.push({
      memberId: member.id,
      member,
      eventId: this.event.id,
      type: ""// TODO:
    });

    this.attendees = attendees;
    this.sortAttendees();

    await this.api.events.add(["event", this.event._id], { attendees: attendees.map((item) => item._id) });

    await this.eventsService.loadEvent(this.event._id);
  }

  async removeAttendee(member: Member) {
    if (!this.event) return;

    let attendees = this.event.attendees || [];
    attendees = attendees.filter((item) => item._id !== member._id);

    this.attendees = attendees; // optimistic update

    await this.api.patch(["event", this.event._id], { attendees: attendees.map((item) => item._id) });

    await this.eventsService.loadEvent(this.event._id);
  }

  toggleSliding(sliding: any) {
    sliding.getOpenAmount().then((open: number) => {
      if (open) sliding.close();
      else sliding.open();
    });
  }

  private async exportExcel(event: Event) {
    console.log(event._links);
    if (event._links.["announcement-template"]) {
      const url = environment.apiRoot + event._links.["announcement-template"].href;
      window.open(url);
    }
  }

  private setActions(event?: Event) {
    this.actions = [
      {
        text: "Přidat",
        icon: "add-outline",
        pinned: true,
        hidden: !event?._links.self.allowed.PATCH,
        handler: () => this.addAttendeeModal(),
      },
      {
        text: "Stáhnout ohlášku",
        icon: "download-outline",
        hidden: !event?._links.self.allowed.GET,
        handler: () => this.exportExcel(event!),
      },
    ];
  }
}
