import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EventResponse, EventResponseWithLinks } from "src/app/api";
import { ModalService } from "src/app/services/modal.service";

@UntilDestroy()
@Component({
  selector: "bo-event-info",
  templateUrl: "./event-info.component.html",
  styleUrls: ["./event-info.component.scss"],
})
export class EventInfoComponent implements OnInit, OnDestroy {
  @Input() event?: EventResponseWithLinks;
  @Output() update = new EventEmitter<Partial<EventResponse>>();

  constructor(private modalService: ModalService) {}

  ngOnInit() {}

  ngOnDestroy() {}

  async editName() {
    const result = await this.modalService.inputModal({
      header: "Název akce",
      inputs: {
        name: {
          placeholder: "Název",
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
}
