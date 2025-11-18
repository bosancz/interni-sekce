import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EventExpenseModalComponent } from "src/app/modules/events/components/event-expense-modal/event-expense-modal.component";
import { ApiService } from "src/app/services/api.service";
import { ModalService } from "src/app/services/modal.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "bo-event-accounting",
	templateUrl: "./event-accounting.component.html",
	styleUrls: ["./event-accounting.component.scss"],
	standalone: false,
})
export class EventAccountingComponent implements OnInit, OnChanges, OnDestroy {
	@Input() event?: SDK.EventResponseWithLinks;

	expenses: SDK.EventExpenseResponseWithLinks[] = [];

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
		this.expenses = await this.api.EventsApi.listEventExpenses(this.event?.id).then((res) => res.data);
		this.expenses.sort((a, b) =>
			a.receiptNumber && b.receiptNumber
				? a.receiptNumber.localeCompare(b.receiptNumber, "cs", { numeric: true })
				: 0,
		);
	}

	async addExpense() {
		if (!this.event) return;

		const expense = await this.modalService.componentModal(EventExpenseModalComponent, {
			expense: { receiptNumber: this.getNextExpenseId() },
		});

		if (expense === null) return;

		try {
			console.log("Adding expense:", expense);
			const newExpense = await this.api.EventsApi.addEventExpense(this.event.id, expense).then((res) => res.data);
			this.expenses.push(newExpense);

			this.toastService.toast("Uloženo");
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit", { color: "danger" });
			throw e;
		}
	}

	async editExpense(expense: SDK.EventExpenseResponseWithLinks) {
		if (!this.event) return;

		const data = await this.modalService.componentModal(EventExpenseModalComponent, {
			expense: expense,
		});

		if (data === null) return;

		const oldExpenses = this.expenses;

		try {
			const i = this.expenses.indexOf(expense);
			this.expenses.splice(i, 1, expense);

			await this.api.EventsApi.updateEventExpense(this.event.id, expense.id, data);
			await this.loadExpenses();

			this.toastService.toast("Uloženo");
		} catch (e) {
			this.expenses = oldExpenses;
			this.toastService.toast("Nepodařilo se uložit", { color: "danger" });
		}
	}

	async removeExpense(expense: SDK.EventExpenseResponseWithLinks) {
		if (!this.event) return;

		const confirmation = await this.modalService.deleteConfirmationModal(
			`Opravdu chceš smazat účtenku ${expense.id}?`,
		);

		if (confirmation) {
			const i = this.expenses.indexOf(expense);
			this.expenses.splice(i, 1, expense);

			await this.api.EventsApi.deleteEventExpense(this.event.id, expense.id);
		}
	}

	private async exportExcel(event: SDK.EventResponseWithLinks) {
		// TODO:
		// if (event._links.["accounting-template"]) {
		//   const url = environment.apiRoot + event._links.["accounting-template"].href;
		//   window.open(url);
		// }
	}

	private getNextExpenseId() {
		const re = /\d+/;

		const maxId = this.expenses
			.filter((expense) => !!expense.receiptNumber)
			.reduce((acc, cur) => {
				const match = re.exec(cur.receiptNumber!);
				return match ? Math.max(acc, Number(match[0])) : acc;
			}, 0);

		return "V" + String(maxId + 1);
	}
}
