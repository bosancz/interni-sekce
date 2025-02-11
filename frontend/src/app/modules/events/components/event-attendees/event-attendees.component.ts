import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { MemberSelectorModalComponent } from "src/app/modules/events/components/member-selector-modal/member-selector-modal.component";
import { ApiService } from "src/app/services/api.service";
import { ModalService } from "src/app/services/modal.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
  selector: "bo-event-attendees",
  templateUrl: "./event-attendees.component.html",
  styleUrls: ["./event-attendees.component.scss"],
  standalone: false,
})
export class EventAttendeesComponent implements OnInit, OnDestroy, OnChanges {
  @Input() event?: SDK.EventResponseWithLinks | null;
  @Output() change = new EventEmitter<void>();

  attendees: SDK.EventAttendeeResponseWithLinks[] = [];
  leaders: SDK.EventAttendeeResponseWithLinks[] = [];

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.event) this.loadAttendees(this.event);
  }

  private async loadAttendees(event?: SDK.EventResponseWithLinks | null) {
    if (!event) {
      this.attendees = [];
      this.leaders = [];
      return;
    }

    const attendees = await this.api.EventsApi.listEventAttendees(event.id).then((res) => res.data);

    this.attendees = attendees.filter((a) => a.type === "attendee");
    this.sortAttendees(this.attendees);

    this.leaders = attendees.filter((a) => a.type === "leader");
    this.sortAttendees(this.leaders);
  }

  private sortAttendees(members: SDK.EventAttendeeResponseWithLinks[]) {
    members.sort((a, b) => {
      if (!a.member || !b.member) return 0;

      const aString = [a.member.nickname, a.member.firstName, a.member.lastName].join(" ");
      const bString = [b.member.nickname, b.member.firstName, b.member.lastName].join(" ");

      return b.member.role.localeCompare(a.member.role) || aString.localeCompare(bString);
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
      this.attendees.push({
        eventId: this.event.id,
        memberId: member.id,
        member,
      } as SDK.EventAttendeeResponseWithLinks);

      this.sortAttendees(this.attendees);

      try {
        await this.api.EventsApi.addEventAttendee(this.event.id, member.id, { type: "attendee" });
        this.toastService.toast("Účastník přidán.");
      } catch (e) {
        this.toastService.toast("Nepodařilo se přidat účastníka.");
        attendees.pop(); // rollback
      }

      this.change.emit();
    }
  }

  async removeAttendee(attendee: SDK.EventAttendeeResponseWithLinks) {
    if (!this.event) return;

    if (attendee.type === "leader") {
      const confirmation = await this.modalService.deleteConfirmationModal("Opravdu chcete odebrat vedoucího akce?");
      if (!confirmation) return;
    }

    try {
      // optimistic update
      this.attendees.filter((item) => item.memberId !== attendee.memberId);

      await this.api.EventsApi.deleteEventAttendee(this.event.id, attendee.memberId);

      if (attendee.type === "leader") this.toastService.toast("Vedoucí odebrán.");
      else this.toastService.toast("Účastník odebrán.");

      this.change.emit();
    } catch (e) {
      this.toastService.toast("Nepodařilo se odebrat účastníka.");
      this.attendees.push(attendee); // rollback
    }
  }

  toggleSliding(sliding: any) {
    sliding.getOpenAmount().then((open: number) => {
      if (open) sliding.close();
      else sliding.open();
    });
  }

  private async exportExcel(event: SDK.EventResponseWithLinks) {
    // TODO:
    // if (event._links.["announcement-template"]) {
    //   const url = environment.apiRoot + event._links.["announcement-template"].href;
    //   window.open(url);
    // }
  }

  private setActions(event?: SDK.EventResponseWithLinks) {
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
