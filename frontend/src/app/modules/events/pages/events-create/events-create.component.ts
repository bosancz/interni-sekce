import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";

import { FormControl, FormGroup } from "@angular/forms";

@Component({
  selector: "events-create",
  templateUrl: "./events-create.component.html",
  styleUrls: ["./events-create.component.scss"],
})
export class EventsCreateComponent implements OnInit {
  showValidationErrors = false;

  constructor(
    private api: ApiService,
    private toastService: ToastService,
    private router: Router,
  ) {}

  form = new FormGroup({
    name: new FormControl<string>("", { nonNullable: true }),
    dateFrom: new FormControl<string>("", { nonNullable: true }),
    dateTill: new FormControl<string>("", { nonNullable: true }),
    description: new FormControl<string>("", { nonNullable: true }),
    type: new FormControl<string>("", { nonNullable: true }),
  });

  ngOnInit() {}

  async createEvent() {
    this.form.markAllAsTouched();

    if (!this.form.valid) {
      this.toastService.toast("Akci nelze vytvořit, ve formuláři jsou chyby.");
      return;
    }

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

    // create the event and wait for confirmation
    let event = await this.api.events.createEvent(eventData).then((res) => res.data);
    // show the confrmation
    this.toastService.toast("Akce vytvořena a uložena.");
    // open the event
    this.router.navigate(["/akce/" + event.id]);
  }
}
