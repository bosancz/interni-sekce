import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EventAttendeeResponse, EventResponseWithLinks } from "src/app/api";
import { MemberSelectorModalComponent } from "src/app/modules/events/components/member-selector-modal/member-selector-modal.component";
import { ApiService } from "src/app/services/api.service";
import { ModalService } from "src/app/services/modal.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@UntilDestroy()
@Component({
  selector: "bo-event-attendees",
  templateUrl: "./event-attendees.component.html",
  styleUrls: ["./event-attendees.component.scss"],
})
export class EventAttendeesComponent implements OnInit, OnDestroy {
  @Input() event?: EventResponseWithLinks;
  @Output() change = new EventEmitter<void>();

  attendees: EventAttendeeResponse[] = [];

  actions: Action[] = [];

  modal?: HTMLIonModalElement;

  constructor(
    private api: ApiService,
    private toastService: ToastService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {}

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

  async addAttendee() {
    if (!this.event) return;

    const member = await this.modalService.componentModal(MemberSelectorModalComponent, {});

    if (member) {
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

      try {
        await this.api.events.addEventAttendee(this.event.id, member.id, {});
        this.toastService.toast("Účastník přidán.");
      } catch (e) {
        this.toastService.toast("Nepodařilo se přidat účastníka.");
        attendees.pop(); // rollback
      }

      this.change.emit();
    }
  }

  async removeAttendee(attendee: EventAttendeeResponse) {
    if (!this.event) return;

    let attendees = this.event.attendees || [];
    attendees = attendees.filter((item) => item.memberId !== attendee.memberId);

    this.attendees = attendees; // optimistic update

    await this.api.events.deleteEventAttendee(this.event.id, attendee.memberId);

    this.change.emit();
  }

  toggleSliding(sliding: any) {
    sliding.getOpenAmount().then((open: number) => {
      if (open) sliding.close();
      else sliding.open();
    });
  }

  private async exportExcel(event: EventResponseWithLinks) {
    // TODO:
    // if (event._links.["announcement-template"]) {
    //   const url = environment.apiRoot + event._links.["announcement-template"].href;
    //   window.open(url);
    // }
  }

  private setActions(event?: EventResponseWithLinks) {
    this.actions = [
      {
        text: "Stáhnout ohlášku",
        icon: "download-outline",
        // hidden: !event?._links.self.allowed.GET, // TODO:
        handler: () => this.exportExcel(event!),
      },
    ];
  }
}
