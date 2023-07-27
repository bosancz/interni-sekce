import { Component, Input, OnInit } from "@angular/core";
import { DateTime } from "luxon";
import { EventResponseWithLinks } from "src/app/api";
import { EventExpenseTypes, EventExpenseTypesMetadata } from "src/app/config/event-expense-types";

@Component({
  selector: "bo-event-expenses-chart",
  templateUrl: "./event-expenses-chart.component.html",
  styleUrls: ["./event-expenses-chart.component.scss"],
})
export class EventExpensesChartComponent implements OnInit {
  days: number = 0;
  persons: number = 0;

  total: number = 0;

  totalByType: { [type: string]: { total: number; type?: EventExpenseTypesMetadata } } = {};

  @Input() set event(event: EventResponseWithLinks) {
    const dateFrom = DateTime.fromISO(event.dateFrom).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    const dateTill = DateTime.fromISO(event.dateTill)
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .plus({ days: 1 });

    this.days = Math.ceil(dateTill.diff(dateFrom, "days").days);
    this.persons = (event.attendees?.length || 0) + (event.leaders?.length || 0);

    // reset
    this.total = 0;
    this.totalByType = {};

    event.expenses?.forEach((expense) => {
      const amount = expense.amount || 0;
      this.total += amount;

      if (expense.type) {
        if (!this.totalByType[expense.type]) {
          this.totalByType[expense.type] = {
            total: 0,
            type: EventExpenseTypes[expense.type],
          };
        }

        this.totalByType[expense.type]!.total += amount;
      }
    });
  }

  constructor() {}

  ngOnInit() {}
}
