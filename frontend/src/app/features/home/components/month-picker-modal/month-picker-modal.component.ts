import { Component, computed, OnInit, signal } from "@angular/core";
import { IonIcon, IonSpinner, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { chevronBackOutline, chevronForwardOutline } from "ionicons/icons";
import { DateTime } from "luxon";
import { MONTH_NAMES } from "src/app/core/config/months";
import { ApiService } from "src/app/core/services/api.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";

interface MonthOption {
	month: number;
	name: string;
	count: number | undefined;
	selected: boolean;
	current: boolean;
}

@Component({
	selector: "bo-month-picker-modal",
	templateUrl: "./month-picker-modal.component.html",
	styleUrls: ["./month-picker-modal.component.scss"],

	imports: [ModalLayoutComponent, IonIcon, IonSpinner],
})
export class MonthPickerModalComponent extends InputModalComponent<string> implements OnInit {
	month?: string;

	year = signal(DateTime.local().year);
	selected = signal<DateTime>(DateTime.local().startOf("month"));

	private counts = signal<Record<number, number[]>>({});
	loading = computed(() => !this.counts()[this.year()]);

	months = computed<MonthOption[]>(() => {
		const year = this.year();
		const counts = this.counts()[year];
		const selected = this.selected();
		const today = DateTime.local();

		return MONTH_NAMES.map((name, i) => ({
			month: i + 1,
			name,
			count: counts?.[i],
			selected: selected.year === year && selected.month === i + 1,
			current: today.year === year && today.month === i + 1,
		}));
	});

	constructor(
		modalController: ModalController,
		private api: ApiService,
	) {
		super(modalController);
		addIcons({ chevronBackOutline, chevronForwardOutline });
	}

	ngOnInit(): void {
		const month = this.month ? DateTime.fromISO(this.month) : undefined;
		if (month?.isValid) {
			this.selected.set(month.startOf("month"));
			this.year.set(month.year);
		}
		this.loadCounts(this.year());
	}

	changeYear(diff: number) {
		this.year.update((year) => year + diff);
		this.loadCounts(this.year());
	}

	pick(option: MonthOption) {
		this.submit.emit(DateTime.local(this.year(), option.month, 1).toFormat("yyyy-MM"));
	}

	countLabel(count: number) {
		if (count === 0) return "bez akcí";
		if (count === 1) return "1 akce";
		if (count < 5) return `${count} akce`;
		return `${count} akcí`;
	}

	private async loadCounts(year: number) {
		if (this.counts()[year]) return;

		const yearStart = DateTime.local(year, 1, 1);
		const events = await this.api.EventsApi.listEvents({
			dateFrom: yearStart.toISODate()!,
			dateTill: yearStart.endOf("year").toISODate()!,
		}).then((res) => res.data);

		const counts = MONTH_NAMES.map((_, i) => {
			const monthStart = yearStart.set({ month: i + 1 }).toISODate()!;
			const monthEnd = yearStart
				.set({ month: i + 1 })
				.endOf("month")
				.toISODate()!;
			return events.filter(
				(event) => event.dateFrom.slice(0, 10) <= monthEnd && event.dateTill.slice(0, 10) >= monthStart,
			).length;
		});

		this.counts.update((all) => ({ ...all, [year]: counts }));
	}
}
