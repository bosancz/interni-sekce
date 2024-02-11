import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { ViewWillEnter } from "@ionic/angular";
import { DateTime } from "luxon";
import { Subscription } from "rxjs";
import { EventResponseWithLinks } from "src/app/api";
import { EventStatuses } from "src/app/config/event-statuses";
import { EventCreateModalComponent } from "src/app/modules/events/components/event-create-modal/event-create-modal.component";
import { ApiService } from "src/app/services/api.service";
import { ModalService } from "src/app/services/modal.service";
import { ToastService } from "src/app/services/toast.service";

@Component({
  selector: "program-planning",
  templateUrl: "./program-planning.component.html",
  styleUrls: ["./program-planning.component.scss"],
})
export class ProgramPlanningComponent implements OnInit, OnDestroy, ViewWillEnter {
  dateFrom?: DateTime;
  dateTill?: DateTime;

  events: EventResponseWithLinks[] = [];

  statuses = EventStatuses;

  paramsSubscription?: Subscription;

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private modalService: ModalService,
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

  async createEvent([dateFrom, dateTill]: [DateTime, DateTime]) {
    const eventData = await this.modalService.componentModal(EventCreateModalComponent, {
      data: {
        dateFrom: dateFrom.toISODate(),
        dateTill: dateTill.toISODate(),
      },
    });

    if (!eventData) return;

    await this.api.events.createEvent(eventData);

    await this.loadEvents();

    this.toastService.toast("Akce vytvořena.");
  }
}
