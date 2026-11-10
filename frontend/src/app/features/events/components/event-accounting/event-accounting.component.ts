import { CommonModule } from "@angular/common";
import { Component, computed, effect, inject, input, OnDestroy, OnInit, output, signal } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { checkmarkOutline, downloadOutline, pieChartOutline, trashOutline } from "ionicons/icons";
import { toSignal } from "@angular/core/rxjs-interop";
import { PlatformService } from "src/app/core/services/platform.service";
import { AdminTableSort } from "src/app/shared/components/admin-table/admin-table.component";
import { EventExpenseTypes } from "src/app/core/config/event-expense-types";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { EventExpenseModalComponent } from "src/app/features/events/components/event-expense-modal/event-expense-modal.component";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AdminTableCellDirective } from "src/app/shared/components/admin-table/admin-table-cell.directive";
import { AdminTableColumnComponent } from "src/app/shared/components/admin-table/admin-table-column.component";
import { AdminTableComponent } from "src/app/shared/components/admin-table/admin-table.component";
import { AddButtonComponent } from "src/app/shared/components/add-button/add-button.component";
import { EventExpensePipe } from "src/app/shared/pipes/event-expense.pipe";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { SectionHeaderComponent } from "src/app/shared/components/section-header/section-header.component";
import { SDK } from "src/sdk";
import { getEventDays, getExpenseAmount } from "../../helpers/event-person-days";
import { EventExpenseTypesInfoComponent } from "../event-expense-types-info/event-expense-types-info.component";
import { EventExpensesStatsModalComponent } from "../event-expenses-stats-modal/event-expenses-stats-modal.component";

@UntilDestroy()
@Component({
	selector: "bo-event-accounting",
	templateUrl: "./event-accounting.component.html",
	styleUrls: ["./event-accounting.component.scss"],

	imports: [
		SectionHeaderComponent,
		CommonModule,
		IonButton,
		IonIcon,
		AdminTableComponent,
		AdminTableColumnComponent,
		AdminTableCellDirective,
		AddButtonComponent,
		EventExpensePipe,
		EventExpenseTypesInfoComponent,
		TooltipDirective,
	],
})
export class EventAccountingComponent implements OnInit, OnDestroy {
	event = input<SDK.EventResponseWithLinks | undefined>();
	count = output<number>();
	change = output<void>();
	readonly noPermissionText = "K této akci nemáš oprávnění.";

	accountingSent = computed(() => !!this.event()?.accountingSentAt);
	canToggleAccountingSent = computed(() => {
		const event = this.event();
		if (!event) return false;
		return event.accountingSentAt
			? event._links.unmarkAccountingSent.allowed
			: event._links.markAccountingSent.applicable && event._links.markAccountingSent.allowed;
	});
	showAccountingSent = computed(() => !!this.event()?._links.markAccountingSent.applicable || this.accountingSent());

	expenses = signal<SDK.EventExpenseResponseWithLinks[]>([]);
	persons = signal(1);
	sort = signal<AdminTableSort>({ sort: "receiptNumber", order: "ASC" });
	private platformService = inject(PlatformService);
	isDesktop = toSignal(this.platformService.isLg, { initialValue: this.platformService.isLg.value });

	sortedExpenses = computed(() => {
		const { sort, order } = this.sort();
		const direction = order === "ASC" ? 1 : -1;
		const collator = new Intl.Collator("cs", { numeric: true });
		const key = (expense: SDK.EventExpenseResponseWithLinks) => {
			switch (sort) {
				case "description":
					return expense.description ?? "";
				case "type":
					return expense.type ? (EventExpenseTypes[expense.type]?.title ?? expense.type) : "";
				case "amount":
					return getExpenseAmount(expense);
				default:
					return expense.receiptNumber ?? "";
			}
		};
		return [...this.expenses()].sort((a, b) => {
			const ka = key(a);
			const kb = key(b);
			const result =
				typeof ka === "number" && typeof kb === "number" ? ka - kb : collator.compare(String(ka), String(kb));
			return result * direction;
		});
	});
	total = computed(() => this.expenses().reduce((sum, expense) => sum + getExpenseAmount(expense), 0));
	personDays = computed(() => {
		const event = this.event();
		return event ? this.persons() * getEventDays(event) : 1;
	});

	expenseActions = (expense: SDK.EventExpenseResponseWithLinks): Action[] => [
		{
			text: "Smazat",
			role: "destructive",
			color: "danger",
			icon: trashOutline,
			hidden: !expense._links.deleteEventExpense.allowed,
			handler: () => this.removeExpense(expense),
		},
	];

	modal?: HTMLIonModalElement;

	constructor(
		private toastService: ToastService,
		private api: ApiService,
		private modalService: ModalService,
	) {
		addIcons({ checkmarkOutline, downloadOutline, pieChartOutline });

		effect(() => {
			const event = this.event();
			if (event) {
				this.loadExpenses();
				this.loadPersons();
			}
		});

		effect(() => this.count.emit(this.expenses().length));
	}

	ngOnInit(): void {}

	ngOnDestroy() {
		this.modal?.dismiss();
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

	private attendeesRequest = 0;

	private async loadPersons() {
		const event = this.event();
		if (!event) return;

		const request = ++this.attendeesRequest;
		const attendees = await this.api.EventsApi.listEventAttendees(event.id)
			.then((res) => res.data)
			.catch(() => []);
		if (request !== this.attendeesRequest) return;

		this.persons.set(attendees.length || 1);
	}

	perPersonDay(expense: SDK.EventExpenseResponseWithLinks) {
		return getExpenseAmount(expense) / this.personDays();
	}

	expenseTitle(expense: SDK.EventExpenseResponseWithLinks) {
		return [expense.receiptNumber, expense.description].filter((part) => !!part).join(" – ");
	}

	openStats() {
		this.modalService.componentModal(
			EventExpensesStatsModalComponent,
			{ expenses: this.expenses(), personDays: this.personDays() },
			{ cssClass: "dialog-brand" },
		);
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
			this.expenses.update((list) => [...list.slice(0, i), { ...expense, ...data }, ...list.slice(i + 1)]);

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

	async toggleAccountingSent() {
		const event = this.event();
		if (!event || !this.canToggleAccountingSent()) return;

		if (event.accountingSentAt) {
			const confirmed = await this.modalService.confirmationModal(
				"Opravdu zrušit označení účtování jako odeslaného?",
				{
					buttonText: "Zrušit odeslání",
				},
			);
			if (!confirmed) return;
		}

		try {
			if (event.accountingSentAt) await this.api.EventsApi.unmarkAccountingSent(event.id);
			else await this.api.EventsApi.markAccountingSent(event.id);
			this.toastService.toast("Uloženo.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit změnu.", { color: "danger" });
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
