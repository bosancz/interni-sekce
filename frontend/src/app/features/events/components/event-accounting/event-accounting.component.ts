import { CommonModule } from "@angular/common";
import { Component, effect, input, OnDestroy, OnInit, signal } from "@angular/core";
import { IonBadge, IonButton, IonList } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { EventExpenseModalComponent } from "src/app/features/events/components/event-expense-modal/event-expense-modal.component";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AddButtonComponent } from "src/app/shared/components/add-button/add-button.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { DeleteButtonComponent } from "src/app/shared/components/delete-button/delete-button.component";
import { ItemComponent } from "src/app/shared/components/item/item.component";
import { EventExpensePipe } from "src/app/shared/pipes/event-expense.pipe";
import { SDK } from "src/sdk";
import { EventExpensesChartComponent } from "../event-expenses-chart/event-expenses-chart.component";

@UntilDestroy()
@Component({
	selector: "bo-event-accounting",
	templateUrl: "./event-accounting.component.html",
	styleUrls: ["./event-accounting.component.scss"],

	imports: [
		CommonModule,
		IonList,
		IonBadge,
		IonButton,
		ItemComponent,
		DeleteButtonComponent,
		AddButtonComponent,
		EventExpensePipe,
		EventExpensesChartComponent,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
	],
})
export class EventAccountingComponent implements OnInit, OnDestroy {
	event = input<SDK.EventResponseWithLinks | undefined>();

	expenses = signal<SDK.EventExpenseResponseWithLinks[]>([]);

	actions: Action[] = [];

	modal?: HTMLIonModalElement;
	alert?: HTMLIonAlertElement;

	constructor(
		private toastService: ToastService,
		private api: ApiService,
		private modalService: ModalService,
	) {
		effect(() => {
			const event = this.event();
			if (event) this.loadExpenses();
		});
	}

	ngOnInit(): void {}

	ngOnDestroy() {
		this.modal?.dismiss();
		this.alert?.dismiss();
	}

	private async loadExpenses() {
		const event = this.event();
		if (!event) return;
		const data = await this.api.EventsApi.listEventExpenses(event.id).then((res) => res.data);
		data.sort((a, b) =>
			a.receiptNumber && b.receiptNumber
				? a.receiptNumber.localeCompare(b.receiptNumber, "cs", { numeric: true })
				: 0,
		);
		this.expenses.set(data);
	}

	async addExpense() {
		const event = this.event();
		if (!event) return;

		const expense = await this.modalService.componentModal(EventExpenseModalComponent, {
			expense: { receiptNumber: this.getNextExpenseId() },
		});

		if (expense === null) return;

		try {
			const newExpense = await this.api.EventsApi.addEventExpense(event.id, expense).then((res) => res.data);
			this.expenses.update((list) => [...list, newExpense]);

			this.toastService.toast("Uloženo");
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit", { color: "danger" });
			throw e;
		}
	}

	async editExpense(expense: SDK.EventExpenseResponseWithLinks) {
		const event = this.event();
		if (!event) return;

		const data = await this.modalService.componentModal(EventExpenseModalComponent, {
			expense: expense,
		});

		if (data === null) return;

		const oldExpenses = this.expenses();

		try {
			const i = this.expenses().indexOf(expense);
			this.expenses.update((list) => [
				...list.slice(0, i),
				{ ...expense, ...data },
				...list.slice(i + 1),
			]);

			await this.api.EventsApi.updateEventExpense(event.id, expense.id, data);
			await this.loadExpenses();

			this.toastService.toast("Uloženo");
		} catch (e) {
			this.expenses.set(oldExpenses);
			this.toastService.toast("Nepodařilo se uložit", { color: "danger" });
		}
	}

	async removeExpense(expense: SDK.EventExpenseResponseWithLinks) {
		const event = this.event();
		if (!event) return;

		const confirmation = await this.modalService.deleteConfirmationModal(`Opravdu chceš smazat účtenku?`);

		if (confirmation) {
			const oldExpenses = this.expenses();

			try {
				const i = this.expenses().indexOf(expense);
				this.expenses.update((list) => [...list.slice(0, i), ...list.slice(i + 1)]);

				await this.api.EventsApi.deleteEventExpense(event.id, expense.id);
				await this.loadExpenses();

				this.toastService.toast("Smazáno");
			} catch (e) {
				this.expenses.set(oldExpenses);
				this.toastService.toast("Nepodařilo se smazat", { color: "danger" });
			}
		}
	}

	async getAccounting(event: SDK.EventResponseWithLinks) {
		if (!event) return;

		try {
			const res = (await this.api.EventsApi.getEventAccounting(event.id, { responseType: "blob" })) as any;

			const blob = new Blob([res.data], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			});

			const fileName = res.headers["content-disposition"]?.match(/filename="?([^";]+)"?/)?.[1] ?? "uctovani.xlsx";

			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = fileName;
			a.click();
			URL.revokeObjectURL(url);
		} catch (e) {
			this.toastService.toast("Nepodařilo se stáhnout účtování.", { color: "danger" });
		}
	}

	private getNextExpenseId() {
		const re = /\d+/;

		const maxId = this.expenses()
			.filter((expense) => !!expense.receiptNumber)
			.reduce((acc, cur) => {
				const match = re.exec(cur.receiptNumber!);
				return match ? Math.max(acc, Number(match[0])) : acc;
			}, 0);

		return "V" + String(maxId + 1);
	}
}
