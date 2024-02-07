import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EventResponseWithLinks, MemberResponse } from "src/app/api";
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
export class EventAttendeesComponent implements OnInit, OnDestroy, OnChanges {
  @Input() event?: EventResponseWithLinks | null;
  @Output() change = new EventEmitter<void>();

  attendees: MemberResponse[] = [];
  leaders: MemberResponse[] = [];

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

  private async loadAttendees(event?: EventResponseWithLinks | null) {
    if (!event) {
      this.attendees = [];
      this.leaders = [];
      return;
    }

    const attendees = await this.api.events.listEventAttendees(event.id).then((res) => res.data);

    this.attendees = attendees.filter((a) => a.type === "attendee").map((m) => m.member!) || [];
    this.sortMembers(this.attendees);

    this.leaders = attendees.filter((a) => a.type === "leader").map((m) => m.member!) || [];
    this.sortMembers(this.leaders);
  }

  private sortMembers(members: MemberResponse[]) {
    members.sort((a, b) => {
      const aString = a.nickname || a.firstName || a.lastName || "";
      const bString = b.nickname || b.firstName || b.lastName || "";
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
      this.attendees.push(member);

      this.sortMembers(this.attendees);

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

  async removeAttendee(member: MemberResponse) {
    if (!this.event) return;

    try {
      // optimistic update
      this.attendees.filter((item) => item.id !== member.id);

      await this.api.events.deleteEventAttendee(this.event.id, member.id);

      this.change.emit();
    } catch (e) {
      this.toastService.toast("Nepodařilo se odebrat účastníka.");
      this.attendees.push(member); // rollback
    }
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
