import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EventResponseWithLinks, EventUpdateBody } from "src/app/api";
import { ModalService } from "src/app/services/modal.service";

@UntilDestroy()
@Component({
  selector: "bo-event-info",
  templateUrl: "./event-info.component.html",
  styleUrls: ["./event-info.component.scss"],
})
export class EventInfoComponent implements OnInit, OnDestroy {
  @Input() event?: EventResponseWithLinks;
  @Output() update = new EventEmitter<EventUpdateBody>();

  constructor(private modalService: ModalService) {}

  ngOnInit() {}

  ngOnDestroy() {}

  async editName() {
    const result = await this.modalService.inputModal({
      header: "Název akce",
      inputs: {
        name: {
          placeholder: "Neočekávaný dýchánek",
          type: "text",
          value: this.event?.name,
        },
      },
    });

    if (result) this.update.emit(result);
  }

  async editDate() {
    const result = await this.modalService.inputModal({
      header: "Datum akce",
      inputs: {
        dateFrom: {
          placeholder: "Datum od",
          type: "date",
          value: this.event?.dateFrom,
        },
        dateTill: {
          placeholder: "Datum do",
          type: "date",
          value: this.event?.dateTill,
        },
      },
    });

    if (result) this.update.emit(result);
  }

  async editPlace() {
    const result = await this.modalService.inputModal({
      header: "Místo akce",
      inputs: {
        place: {
          placeholder: "Dno pytle (u Bilba doma)",
          value: this.event?.place,
        },
      },
    });

    if (result) this.update.emit(result);
  }

  async editMeetingStart() {
    const result = await this.modalService.inputModal({
      header: "Místo a čas začátku akce",
      inputs: {
        meetingPlaceStart: {
          placeholder: "Dno pytle, 18:30",
          value: this.event?.meetingPlaceStart,
        },
      },
    });

    if (result) this.update.emit(result);
  }

  async editMeetingEnd() {
    const result = await this.modalService.inputModal({
      header: "Místo a čas konce akce",
      inputs: {
        meetingPlaceEnd: {
          placeholder: "Dno pytle, 3:00",
          value: this.event?.meetingPlaceEnd,
        },
      },
    });

    if (result) this.update.emit(result);
  }

  async editDescription() {
    const result = await this.modalService.inputModal({
      header: "Popis akce",
      inputs: {
        description: {
          placeholder: "Popis",
          type: "text",
          value: this.event?.description,
        },
      },
    });

    if (result) this.update.emit(result);
  }

  updateType(type: string) {
    this.update.emit({ type });
  }

  updateGroup(groupsIds: number[]) {
    this.update.emit({ groupsIds });
  }
}
