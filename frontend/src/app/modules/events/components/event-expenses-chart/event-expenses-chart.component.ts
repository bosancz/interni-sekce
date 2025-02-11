import { Component, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { ChartData, ChartOptions } from "chart.js";
import { DateTime } from "luxon";
import { EventExpenseResponseWithLinks, EventExpenseTypesEnum, EventResponseWithLinks } from "src/app/api";
import { EventExpenseTypes } from "src/app/config/event-expense-types";
import { ApiService } from "src/app/services/api.service";

@Component({
    selector: "bo-event-expenses-chart",
    templateUrl: "./event-expenses-chart.component.html",
    styleUrls: ["./event-expenses-chart.component.scss"],
    standalone: false
})
export class EventExpensesChartComponent implements OnInit, OnChanges {
  @Input() event?: EventResponseWithLinks;
  @Input() expenses?: EventExpenseResponseWithLinks[];

  days: number = 0;
  persons: number = 0;

  total: number = 0;

  totalByType: Record<EventExpenseTypesEnum, number> = {
    accommodation: 0,
    food: 0,
    material: 0,
    other: 0,
    transport: 0,
  };

  chartData?: ChartData<"doughnut">;

  chartOptions: ChartOptions<"doughnut"> = {
    cutout: "60%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          useBorderRadius: true,
        },
      },
    },
  };

  constructor(private api: ApiService) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    this.updateChart();
  }

  private async updateChart() {
    this.totalByType = {
      accommodation: 0,
      food: 0,
      material: 0,
      other: 0,
      transport: 0,
    };

    if (!this.event || !this.expenses) return;

    const dateFrom = DateTime.fromISO(this.event.dateFrom).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    const dateTill = DateTime.fromISO(this.event.dateTill)
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .plus({ days: 1 });

    this.days = Math.ceil(dateTill.diff(dateFrom, "days").days);

    const attendees = await this.api.events.listEventAttendees(this.event.id).then((res) => res.data);

    this.persons = attendees?.length || 1;

    const data: ChartData<"doughnut">["datasets"][0]["data"] = Object.keys(EventExpenseTypes).map((type) => {
      return this.getTotalExpenseByType(type as EventExpenseTypesEnum) / this.persons / this.days;
    });

    this.chartData = {
      labels: Object.values(EventExpenseTypes).map((t) => t.title),
      datasets: [
        {
          // backgroundColor: EventExpenseTypes[type as EventExpenseTypesEnum].color,
          // tooltip: Math.round(value * 100) / 100 + "/os/den",
          data,
          borderRadius: 4,

          backgroundColor: Object.values(EventExpenseTypes).map((t) => t.color),
        },
      ],
    };

    this.total = this.expenses.reduce((acc, e) => acc + parseFloat(e.amount as any), 0);
  }

  private getTotalExpenseByType(type: EventExpenseTypesEnum) {
    return this.expenses?.filter((e) => e.type === type).reduce((acc, e) => acc + parseFloat(e.amount as any), 0) || 0;
  }
}
