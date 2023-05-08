import { Component, Input, OnInit } from "@angular/core";
import { ModalController, Platform } from "@ionic/angular";
import { EventExpenseResponse } from "src/app/api";
import { EventExpenseTypes } from "src/app/config/event-expense-types";

@Component({
  selector: "bo-event-expense-modal",
  templateUrl: "./event-expense-modal.component.html",
  styleUrls: ["./event-expense-modal.component.scss"],
})
export class EventExpenseModalComponent implements OnInit {
  @Input() expense!: EventExpenseResponse;

  types = EventExpenseTypes;

  constructor(private modalController: ModalController, public platform: Platform) {}

  ngOnInit(): void {}

  async save(expense: EventExpenseResponse) {
    await this.modalController.dismiss({ expense });
  }

  async close() {
    await this.modalController.dismiss();
  }
}
