import {
	afterNextRender,
	Component,
	ElementRef,
	computed,
	Injector,
	OnDestroy,
	OnInit,
	signal,
	viewChild,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
	InfiniteScrollCustomEvent,
	IonIcon,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { addOutline, chevronBackOutline, chevronForwardOutline } from "ionicons/icons";
import { DateTime } from "luxon";
import { MONTH_NAMES } from "src/app/core/config/months";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { EventCreateModalComponent } from "src/app/features/events/components/event-create-modal/event-create-modal.component";
import { MonthPickerModalComponent } from "src/app/features/home/components/month-picker-modal/month-picker-modal.component";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { EventCalendarComponent } from "src/app/shared/components/event-calendar/event-calendar.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-home-calendar",
	templateUrl: "./home-calendar.component.html",
	styleUrls: ["./home-calendar.component.scss"],

	imports: [
		EventCalendarComponent,
		PageContentComponent,
		PageHeaderComponent,
		IonIcon,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
	],
})
export class HomeCalendarComponent implements OnInit, OnDestroy {
	readonly weekdays = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

	dateFrom = signal<DateTime>(DateTime.local().startOf("month").minus({ months: 1 }));
	dateTill = signal<DateTime>(DateTime.local().plus({ months: 3 }).endOf("month"));

	visibleMonth = signal<DateTime>(DateTime.local().startOf("month"));
	visibleMonthLabel = computed(() => `${MONTH_NAMES[this.visibleMonth().month - 1]} ${this.visibleMonth().year}`);
	isCurrentMonth = computed(() => this.visibleMonth().hasSame(DateTime.local(), "month"));

	scrollReady = signal(false);

	addEventEnabled = signal(false);

	events = signal<SDK.EventResponseWithLinks[]>([]);

	actions = signal<Action[]>([
		{
			text: "Přidat akci",
			icon: "add-outline",
			pinned: false,
			handler: () => this.enableAddEvent(),
		},
	]);

	private pageContent = viewChild(PageContentComponent);
	private scrollElement?: HTMLElement;
	private scrollFrame?: number;
	private loadToken = 0;

	private readonly onScroll = () => {
		if (this.scrollFrame) return;
		this.scrollFrame = requestAnimationFrame(() => {
			this.scrollFrame = undefined;
			this.updateVisibleMonth();
		});
	};

	constructor(
		private api: ApiService,
		private readonly modalService: ModalService,
		private readonly toastService: ToastService,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly injector: Injector,
		private readonly elementRef: ElementRef<HTMLElement>,
	) {
		addIcons({ addOutline, chevronBackOutline, chevronForwardOutline });
	}

	async ngOnInit() {
		const param = this.route.snapshot.queryParamMap.get("mesic");
		const month = param ? DateTime.fromFormat(param, "yyyy-MM") : undefined;

		if (month?.isValid) await this.goToMonth(month);
		else await this.goToToday(false);

		this.scrollReady.set(true);
	}

	ngOnDestroy(): void {
		this.scrollElement?.removeEventListener("scroll", this.onScroll);
		if (this.scrollFrame) cancelAnimationFrame(this.scrollFrame);
	}

	async previousMonth() {
		await this.goToMonth(this.visibleMonth().minus({ months: 1 }));
		this.setMonthParam(this.visibleMonth());
	}

	async nextMonth() {
		await this.goToMonth(this.visibleMonth().plus({ months: 1 }));
		this.setMonthParam(this.visibleMonth());
	}

	async goToToday(updateUrl = true) {
		const today = DateTime.local();
		await this.goToMonth(today, today.startOf("week"));
		if (updateUrl) this.setMonthParam(undefined);
	}

	async openMonthPicker() {
		const month = await this.modalService.componentModal(
			MonthPickerModalComponent,
			{ month: this.visibleMonth().toFormat("yyyy-MM") },
			{ cssClass: "dialog-brand" },
		);
		if (!month) return;

		const date = DateTime.fromFormat(month, "yyyy-MM");
		if (date.hasSame(DateTime.local(), "month")) return this.goToToday();

		await this.goToMonth(date);
		this.setMonthParam(date);
	}

	async loadMorePrevious(event?: InfiniteScrollCustomEvent) {
		const anchor = this.getScrollAnchor();

		this.dateFrom.update((dateFrom) => dateFrom.minus({ months: 1 }));
		await this.loadEvents();
		await this.waitForRender();

		if (anchor && this.scrollElement) {
			this.scrollElement.scrollTop += anchor.element.getBoundingClientRect().top - anchor.top;
		}

		event?.target.complete();
	}

	async loadMoreFuture(event?: InfiniteScrollCustomEvent) {
		this.dateTill.update((dateTill) => dateTill.plus({ months: 1 }).endOf("month"));
		await this.loadEvents();
		event?.target.complete();
	}

	private async goToMonth(month: DateTime, scrollDate?: DateTime) {
		const monthStart = month.startOf("month");

		if (monthStart.startOf("week") < this.dateFrom() || monthStart.endOf("month") > this.dateTill()) {
			this.dateFrom.set(monthStart.minus({ months: 1 }));
			this.dateTill.set(monthStart.plus({ months: 3 }).endOf("month"));
		}

		this.visibleMonth.set(monthStart);

		const loading = this.loadEvents();
		await this.waitForRender();
		await this.attachScrollListener();
		this.scrollTo(scrollDate ?? monthStart, !scrollDate);
		await loading;
	}

	private async loadEvents() {
		const token = ++this.loadToken;
		const events = await this.api.EventsApi.listEvents({
			dateTill: this.dateTill().toISODate()!,
			dateFrom: this.dateFrom().toISODate()!,
		}).then((res) => res.data);

		if (token === this.loadToken) this.events.set(events);
	}

	private scrollTo(date: DateTime, monthLabel: boolean) {
		const container = this.scrollElement;
		if (!container) return;

		const host = this.elementRef.nativeElement;
		const element =
			(monthLabel && host.querySelector<HTMLElement>(`.month-label[data-month="${date.toFormat("yyyy-MM")}"]`)) ||
			host.querySelector<HTMLElement>(`.calendar-row[data-week="${date.startOf("week").toISODate()}"]`);
		if (!element) return;

		container.scrollTop += element.getBoundingClientRect().top - container.getBoundingClientRect().top;
	}

	private updateVisibleMonth() {
		const container = this.scrollElement;
		if (!container) return;

		const top = container.getBoundingClientRect().top + 8;
		const labels = [...this.elementRef.nativeElement.querySelectorAll<HTMLElement>(".month-label[data-month]")];
		if (!labels.length) return;

		const passed = labels.filter((label) => label.getBoundingClientRect().top <= top);
		const month = passed.length
			? DateTime.fromFormat(passed[passed.length - 1].dataset["month"]!, "yyyy-MM")
			: DateTime.fromFormat(labels[0].dataset["month"]!, "yyyy-MM").minus({ months: 1 });

		if (!month.equals(this.visibleMonth())) this.visibleMonth.set(month);
	}

	private getScrollAnchor() {
		const container = this.scrollElement;
		if (!container) return null;

		const top = container.getBoundingClientRect().top;
		const rows = this.elementRef.nativeElement.querySelectorAll<HTMLElement>(".calendar-row[data-week]");
		const element = [...rows].find((row) => row.getBoundingClientRect().bottom > top);
		return element ? { element, top: element.getBoundingClientRect().top } : null;
	}

	private async attachScrollListener() {
		if (this.scrollElement) return;
		this.scrollElement = await this.pageContent()?.contentEl?.getScrollElement();
		this.scrollElement?.addEventListener("scroll", this.onScroll, { passive: true });
	}

	private async waitForRender() {
		await new Promise<void>((resolve) => afterNextRender(() => resolve(), { injector: this.injector }));
		await new Promise((resolve) => requestAnimationFrame(resolve));
	}

	private setMonthParam(month: DateTime | undefined) {
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: { mesic: month ? month.toFormat("yyyy-MM") : null },
			queryParamsHandling: "merge",
			replaceUrl: true,
		});
	}

	private enableAddEvent() {
		this.addEventEnabled.set(true);
		this.toastService.toast("Vyberte počátek a konec akce kliknutím v kalendáři.", {
			buttons: [{ text: "Přidat ručně", handler: () => this.createEvent() }],
		});
	}

	async createEvent(dates?: [DateTime, DateTime]) {
		const eventData = await this.modalService.componentModal(EventCreateModalComponent, {
			data: {
				dateFrom: dates?.[0].toISODate() ?? undefined,
				dateTill: dates?.[1].toISODate() ?? undefined,
			},
		});

		if (!eventData) return;

		await this.api.EventsApi.createEvent(eventData);

		await this.loadEvents();

		this.toastService.toast("Akce vytvořena.");
	}
}
