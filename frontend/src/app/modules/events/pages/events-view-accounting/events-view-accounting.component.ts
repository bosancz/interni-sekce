import { Component, OnDestroy, OnInit } from "@angular/core";
import { AlertController, ModalController } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EventExpenseResponse, EventResponse } from "src/app/api";
import { EventExpenseTypes } from "src/app/config/event-expense-types";
import { EventExpenseModalComponent } from "src/app/modules/events/components/event-expense-modal/event-expense-modal.component";
import { EventsService } from "src/app/modules/events/services/events.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@UntilDestroy()
@Component({
  selector: "bo-events-view-accounting",
  templateUrl: "./events-view-accounting.component.html",
  styleUrls: ["./events-view-accounting.component.scss"],
})
export class EventsViewAccountingComponent implements OnInit, OnDestroy {
  event?: EventResponse;

  expenses: EventExpenseResponse[] = [];

  actions: Action[] = [];

  modal?: HTMLIonModalElement;
  alert?: HTMLIonAlertElement;

  constructor(
    private eventsService: EventsService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.eventsService.event$.pipe(untilDestroyed(this)).subscribe((event) => {
      this.event = event;
      this.expenses = event?.expenses || [];
      this.sortExpenes();

      this.setActions(event);
    });
  }

  ngOnDestroy() {
    this.modal?.dismiss();
    this.alert?.dismiss();
  }

  private sortExpenes() {
    this.expenses.sort((a, b) => a.id.localeCompare(b.id, "cs", { numeric: true }));
  }

  async editExpenseModal(expense?: EventExpenseResponse) {
    const i = expense ? this.expenses.indexOf(expense) : -1;

    this.modal = await this.modalController.create({
      component: EventExpenseModalComponent,
      componentProps: {
        expense: expense || { id: this.getNextExpenseId() },
      },
    });

    this.modal.onWillDismiss().then((ev) => {
      if (ev.data?.expense) this.saveExpense(i, ev.data?.expense);
    });

    await this.modal.present();
  }

  async saveExpense(i: number, expense: EventExpenseResponse) {
    if (!this.event) return;

    const expenses = this.expenses.slice();

    if (i >= 0) expenses.splice(i, 1, expense);
    else expenses.push(expense);

    this.expenses = expenses; // optimistic update

    await this.eventsService.updateEvent(this.event.id, { expenses });
    await this.eventsService.loadEvent(this.event.id);
  }

  async removeExpense(expense: EventExpenseResponse) {
    this.alert = await this.alertController.create({
      header: "Smazat účtenku",
      message: `Opravdu chceš smazat účtenku ${expense.id}?`,
      buttons: [
        { role: "cancel", text: "Zrušit" },
        { role: "destructive", text: "Smazat", handler: () => this.removeExpenseConfirmed(expense) },
      ],
    });

    await this.alert.present();
  }

  async removeExpenseConfirmed(expense: EventExpenseResponse) {
    if (!this.event) return;

    const expenses = this.expenses.filter((item) => item !== expense);

    this.expenses = expenses; // optimistic update

    await this.eventsService.updateEvent(this.event.id, { expenses });
    await this.eventsService.loadEvent(this.event.id);
  }

  toggleSliding(sliding: any) {
    sliding.getOpenAmount().then((open: number) => {
      if (open) sliding.close();
      else sliding.open();
    });
  }

  getExpenseColor(expense: EventExpenseResponse) {
    return expense.type ? EventExpenseTypes[expense.type].color : "primary";
  }

  private getNextExpenseId() {
    const re = /\d+/;

    const maxId = this.expenses.reduce((acc, cur) => {
      const match = re.exec(cur.id);
      return match ? Math.max(acc, Number(match[0])) : acc;
    }, 0);

    return "V" + String(maxId + 1);
  }

  private async exportExcel(event: EventResponse) {
    // TODO:
    // if (event._links.["accounting-template"]) {
    //   const url = environment.apiRoot + event._links.["accounting-template"].href;
    //   window.open(url);
    // }
  }

  private setActions(event?: EventResponse) {
    this.actions = [
      {
        text: "Přidat",
        icon: "add-outline",
        pinned: true,
        hidden: !event?._links.addEventExpense.allowed,
        handler: () => this.editExpenseModal(),
      },
      {
        text: "Stáhnout účtování",
        icon: "download-outline",
        // hidden: !event?._links..allowed.GET, // TODO:
        handler: () => this.exportExcel(event!),
      },
    ];
  }
}