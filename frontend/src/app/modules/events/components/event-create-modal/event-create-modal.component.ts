import { Component, Input, OnInit } from "@angular/core";

import { FormControl, FormGroup } from "@angular/forms";
import { ModalController } from "@ionic/angular";
import { AbstractModalComponent } from "src/app/services/modal.service";
import { SDK } from "src/sdk";

@Component({
  selector: "bo-event-create-modal",
  templateUrl: "./event-create-modal.component.html",
  styleUrls: ["./event-create-modal.component.scss"],
  standalone: false,
})
export class EventCreateModalComponent extends AbstractModalComponent<SDK.EventCreateBody> implements OnInit {
  @Input() data: Partial<SDK.EventCreateBody> = {};

  showValidationErrors = false;

  constructor(modalController: ModalController) {
    super(modalController);
  }

  form = new FormGroup({
    name: new FormControl<string>("", { nonNullable: true }),
    dateFrom: new FormControl<string>("", { nonNullable: true }),
    dateTill: new FormControl<string>("", { nonNullable: true }),
    description: new FormControl<string>("", { nonNullable: true }),
    type: new FormControl<string>("", { nonNullable: true }),
  });

  ngOnInit() {
    this.form.patchValue({
      dateFrom: this.data.dateFrom,
      dateTill: this.data.dateTill,
      name: this.data.name,
      description: this.data.description ?? undefined,
      type: this.data.type ?? undefined,
    });
  }

  async createEvent() {
    this.form.markAllAsTouched();

    this.showValidationErrors = true;
    if (!this.form.valid) return;

    // get data from form
    // TODO: create a typed form
    let eventData = this.form.getRawValue();

    // prevent switched date order
    if (eventData.dateFrom && eventData.dateTill) {
      const dates = [eventData.dateFrom, eventData.dateTill];
      dates.sort();
      eventData.dateFrom = dates[0];
      eventData.dateTill = dates[1];
    }

    this.submit.emit(eventData);
  }
}
