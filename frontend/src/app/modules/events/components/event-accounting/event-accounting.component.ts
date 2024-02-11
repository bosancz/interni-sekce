import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EventExpenseResponseWithLinks, EventResponseWithLinks } from "src/app/api";
import { EventExpenseModalComponent } from "src/app/modules/events/components/event-expense-modal/event-expense-modal.component";
import { ApiService } from "src/app/services/api.service";
import { ModalService } from "src/app/services/modal.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@UntilDestroy()
@Component({
  selector: "bo-event-accounting",
  templateUrl: "./event-accounting.component.html",
  styleUrls: ["./event-accounting.component.scss"],
})
export class EventAccountingComponent implements OnInit, OnChanges, OnDestroy {
  @Input() event?: EventResponseWithLinks;

  expenses: EventExpenseResponseWithLinks[] = [];

  actions: Action[] = [];

  modal?: HTMLIonModalElement;
  alert?: HTMLIonAlertElement;

  constructor(
    private toastService: ToastService,
    private api: ApiService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.event) this.loadExpenses();
  }

  ngOnDestroy() {
    this.modal?.dismiss();
    this.alert?.dismiss();
  }

  private async loadExpenses() {
    if (!this.event) return;
    this.expenses = await this.api.events.listEventExpenses(this.event?.id).then((res) => res.data);
    this.expenses.sort((a, b) => a.receiptNumber.localeCompare(b.receiptNumber, "cs", { numeric: true }));
  }

  async editExpense(expense: EventExpenseResponseWithLinks) {
    if (!this.event) return;

    const data = await this.modalService.componentModal(EventExpenseModalComponent, {
      expense: expense || { id: this.getNextExpenseId() },
    });

    if (data === null) return;

    const oldExpenses = this.expenses;

    try {
      const i = this.expenses.indexOf(expense);
      this.expenses.splice(i, 1, expense);

      await this.api.events.updateEventExpense(this.event.id, expense.id, data);
      await this.loadExpenses();

      this.toastService.toast("Uloženo");
    } catch (e) {
      this.expenses = oldExpenses;
      this.toastService.toast("Nepodařilo se uložit", { color: "danger" });
    }
  }

  async removeExpense(expense: EventExpenseResponseWithLinks) {
    if (!this.event) return;

    const confirmation = await this.modalService.deleteConfirmationModal(`Opravdu chceš smazat účtenku ${expense.id}?`);

    if (confirmation) {
      const i = this.expenses.indexOf(expense);
      this.expenses.splice(i, 1, expense);

      await this.api.events.deleteEventExpense(this.event.id, expense.id);
    }
  }

  private async exportExcel(event: EventResponseWithLinks) {
    // TODO:
    // if (event._links.["accounting-template"]) {
    //   const url = environment.apiRoot + event._links.["accounting-template"].href;
    //   window.open(url);
    // }
  }

  private getNextExpenseId() {
    const re = /\d+/;

    const maxId = this.expenses.reduce((acc, cur) => {
      const match = re.exec(cur.receiptNumber);
      return match ? Math.max(acc, Number(match[0])) : acc;
    }, 0);

    return "V" + String(maxId + 1);
  }
}
