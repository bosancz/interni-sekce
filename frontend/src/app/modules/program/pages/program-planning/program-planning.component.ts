import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { AlertController, ViewWillEnter } from "@ionic/angular";
import { DateTime } from "luxon";
import { Subscription } from "rxjs";
import { EventCreateBody, EventResponse } from "src/app/api";
import { EventStatuses } from "src/app/config/event-statuses";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";

@Component({
  selector: "program-planning",
  templateUrl: "./program-planning.component.html",
  styleUrls: ["./program-planning.component.scss"],
})
export class ProgramPlanningComponent implements OnInit, OnDestroy, ViewWillEnter {
  dateFrom?: DateTime;
  dateTill?: DateTime;

  events: EventResponse[] = [];

  statuses = EventStatuses;

  paramsSubscription?: Subscription;

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private alertController: AlertController,
  ) {}

  ngOnInit() {
    this.paramsSubscription = this.route.queryParams.subscribe((params: Params) => {
      if (params.dateFrom && params.dateTill) {
        this.dateFrom = DateTime.fromISO(params.dateFrom);
        this.dateTill = DateTime.fromISO(params.dateTill);

        this.loadEvents();
      }
    });
  }

  ionViewWillEnter() {
    this.loadEvents();
  }

  ngOnDestroy() {
    this.paramsSubscription?.unsubscribe();
  }

  async loadEvents() {
    if (!this.dateTill || !this.dateFrom) return;

    const requestOptions = {
      filter: {
        dateFrom: { $lte: this.dateTill.toISODate() },
        dateTill: { $gte: this.dateFrom.toISODate() },
      },
      select: "_id name status type dateFrom dateTill timeFrom timeTill",
    };

    // TODO: use options above
    this.events = await this.api.events.listEvents().then((res) => res.data);
  }

  setPeriod(period: [string, string]) {
    const params = {
      dateFrom: period[0],
      dateTill: period[1],
    };
    this.router.navigate(["./"], { queryParams: params, relativeTo: this.route, replaceUrl: true });
  }

  async openCreateEventModal([dateFrom, dateTill]: [DateTime, DateTime]) {
    const alert = await this.alertController.create({
      header: "Vytvořit akci",
      inputs: [
        {
          name: "name",
          placeholder: "Neočekávaný dýchánek",
          attributes: { required: true },
        },
        {
          name: "dateFrom",
          type: "date",
          value: dateFrom.toISODate(),
          attributes: { required: true },
        },
        {
          name: "dateTill",
          type: "date",
          value: dateTill.toISODate(),
          attributes: { required: true },
        },
        {
          name: "description",
          type: "textarea",
          placeholder: "Všichni budou tak opilí, že nám Šmajdalf ukáže trik se špičatým...",
          attributes: { required: true },
        },
      ],
      buttons: [
        { text: "Zrušit", role: "cancel" },
        {
          text: "Vytvořit",
          handler: (data: any) => {
            if (!data.name || !data.dateFrom || !data.dateTill) {
              this.toastService.toast("Název i datum musí být vyplněno.");
              return;
            }

            return this.createEvent(data);
          },
        },
      ],
    });

    alert.present();
  }

  async createEvent(eventData: EventCreateBody) {
    await this.api.events.createEvent(eventData);

    await this.loadEvents();

    this.toastService.toast("Akce vytvořena.");
  }
}
