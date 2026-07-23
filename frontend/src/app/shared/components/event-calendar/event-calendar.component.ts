import { Component, effect, HostListener, input, OnInit, output, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonBadge } from "@ionic/angular/standalone";
import { CzechHolidays } from "czech-holidays";
import { DateTime } from "luxon";
import { ApiService } from "src/app/core/services/api.service";
import { SDK } from "src/sdk";
import { TooltipDirective } from "../../directives/tooltip.directive";
import { EventStatusPipe } from "../../pipes/event-status.pipe";

const months = [
	"Leden",
	"Únor",
	"Březen",
	"Duben",
	"Květen",
	"Červen",
	"Červenec",
	"Srpen",
	"Září",
	"Říjen",
	"Listopad",
	"Prosinec",
];

class CalendarRow {
	days: CalendarDay[] = [];

	blocks = {
		own: new CalendarRowBlock<SDK.EventResponseWithLinks>(),
		cpv: new CalendarRowBlock<SDK.CPVEventResponseWithLinks>(),
	};

	constructor(
		public from: DateTime,
		public to: DateTime,
	) {}
}

class CalendarRowBlock<T extends SDK.CPVEventResponseWithLinks | SDK.EventResponseWithLinks> {
	events: CalendarEvent<T>[] = [];
	levels: number = 1;
}

interface CalendarDayProperties {
	holiday?: boolean;
	empty?: boolean;
	weekend?: boolean;
	oddMonth: boolean;
	today?: boolean;
}
class CalendarDay {
	eventCount: number = 0;
	constructor(
		public date: DateTime,
		public properties: CalendarDayProperties,
	) {}
}

class CalendarEvent<T extends SDK.CPVEventResponseWithLinks | SDK.EventResponseWithLinks> {
	level: number = 0;

	dateFrom: DateTime;
	dateTill: DateTime;

	constructor(public event: T) {
		this.dateFrom = DateTime.fromISO(event.dateFrom).set({ hour: 0, minute: 0 });
		this.dateTill = DateTime.fromISO(event.dateTill).set({ hour: 0, minute: 0 });
	}
}

@Component({
	selector: "bo-event-calendar",
	templateUrl: "./event-calendar.component.html",
	styleUrls: ["./event-calendar.component.scss"],

	imports: [RouterLink, IonBadge, EventStatusPipe, TooltipDirective],
})
export class EventCalendarComponent implements OnInit {
	dateFromString = input.required<DateTime | string, DateTime>({
		alias: "dateFrom",
		transform: (value: DateTime | string): DateTime => {
			const date = typeof value === "string" ? DateTime.fromISO(value) : value;
			return date.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
		},
	});
	dateTillString = input.required<DateTime | string, DateTime>({
		alias: "dateTill",
		transform: (value: DateTime | string): DateTime => {
			const date = typeof value === "string" ? DateTime.fromISO(value) : value;
			return date.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
		},
	});

	events = input<SDK.EventResponseWithLinks[]>([]);
	cpv = input<boolean>(false);
	selection = input<boolean>(false);
	headingLevel = input<number>(3);

	select = output<[DateTime, DateTime]>();

	private calendarRows: CalendarRow[] = [];
	calendar = signal<CalendarRow[]>([]);

	selectedDate = signal<DateTime | undefined>(undefined);
	hoverDate = signal<DateTime | undefined>(undefined);

	dateFrom!: DateTime;
	dateTill!: DateTime;

	eventsCPV: SDK.CPVEventResponseWithLinks[] = [];

	eventHeight = 22;

	constructor(private api: ApiService) {
		effect(() => {
			const dateFrom = this.dateFromString() as DateTime;
			const dateTill = this.dateTillString() as DateTime;
			const cpv = this.cpv();
			const events = this.events();

			this.dateFrom = dateFrom;
			this.dateTill = dateTill;
			this.createCalendar();
			if (events) this.assignEvents(events, "own");
			if (this.eventsCPV) this.assignEvents(this.eventsCPV, "cpv");

			if (cpv) {
				this.loadEventsCPV();
			} else {
				this.eventsCPV = [];
			}
		});

		effect(() => {
			const events = this.events();
			if (events) this.assignEvents(events, "own");
		});
	}

	ngOnInit() {}

	createCalendar() {
		let currentDate = this.dateFrom.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

		if (currentDate.weekday > 1) currentDate = currentDate.minus({ days: currentDate.weekday - 1 });

		let dateTill = this.dateTill;
		if (dateTill.weekday < 7) dateTill = dateTill.plus({ days: 7 - dateTill.weekday });

		let holidays = CzechHolidays(currentDate.year);

		let row = new CalendarRow(currentDate, currentDate.plus({ days: 6 }));
		const calendar = [row];

		while (currentDate <= dateTill) {
			if (currentDate > row.to) {
				row = new CalendarRow(currentDate, currentDate.plus({ days: 6 }));
				calendar.push(row);
			}

			if (currentDate.year !== row.to.year) holidays.push(...CzechHolidays(row.to.year));

			const dayInfo = {
				empty: currentDate < this.dateFrom || currentDate > this.dateTill,
				holiday: this.isHoliday(currentDate),
				weekend: this.isWeekend(currentDate),
				oddMonth: (currentDate.month - this.dateFrom.month) % 2 === 0,
				today: this.isToday(currentDate),
			};

			row.days.push(new CalendarDay(currentDate, dayInfo));

			currentDate = currentDate.plus({ days: 1 });
		}

		this.calendarRows = calendar;
		this.syncCalendarSignal();
	}

	private syncCalendarSignal() {
		this.calendar.set([...this.calendarRows]);
	}

	async loadEventsCPV() {
		this.eventsCPV = [];

		this.api.EventsApi.getCPVEvents()
			.then((res) => res.data)
			.then((events) => {
				this.eventsCPV.push(...events);
				this.assignEvents(this.eventsCPV, "cpv");
			});
	}

	assignEvents(events: Array<SDK.EventResponseWithLinks>, type: "own"): void;
	assignEvents(events: Array<SDK.CPVEventResponseWithLinks>, type: "cpv"): void;
	assignEvents(
		events: Array<SDK.CPVEventResponseWithLinks> | Array<SDK.EventResponseWithLinks>,
		type: "own" | "cpv",
	): void {
		if (!this.calendarRows) return;
		if (!events) return;

		this.calendarRows.forEach((row) => {
			// get the monthBlock to which we assign
			const rowBlock = row.blocks[type];

			// assign events based on first and last day, convert to CalendarEvent
			rowBlock.events = <
				CalendarEvent<SDK.CPVEventResponseWithLinks>[] | CalendarEvent<SDK.EventResponseWithLinks>[]
			>events
				.map((event) => new CalendarEvent(event))
				.filter((event) => event.dateTill >= row.from && event.dateFrom <= row.to);

			rowBlock.events.sort((a, b) => a.dateFrom.diff(b.dateFrom).valueOf());

			const eventCounts = Array(7).fill(0);

			rowBlock.events.forEach((event) => {
				for (let date = event.dateFrom; date <= event.dateTill; date = date.plus({ days: 1 })) {
					if (date >= row.from && date <= row.to) {
						event.level = Math.max(event.level, eventCounts[date.weekday - 1] + 1);
						eventCounts[date.weekday - 1] = event.level;
					}
				}
			});

			rowBlock.levels = Math.max(...eventCounts);
		});

		this.syncCalendarSignal();
	}

	private isWeekend(date: DateTime): boolean {
		return date.weekday >= 6;
	}

	private isHoliday(date: DateTime): boolean {
		return CzechHolidays(date.year).some((item) => item.m === date.month && item.d === date.day);
	}

	private isToday(date: DateTime): boolean {
		return date.hasSame(DateTime.now(), "day");
	}

	isSelectedRange(day: CalendarDay) {
		const selectedDate = this.selectedDate();
		const hoverDate = this.hoverDate();
		if (!selectedDate || !hoverDate) return false;
		const range: [DateTime, DateTime] = [selectedDate, hoverDate];
		range.sort();
		return day.date >= range[0] && day.date <= range[1];
	}

	setSelection(day: CalendarDay) {
		if (!this.selection()) return;

		const selectedDate = this.selectedDate();
		if (selectedDate) {
			const range: [DateTime, DateTime] = [selectedDate, day.date];
			range.sort();
			this.select.emit(range);
			this.selectedDate.set(undefined);
		} else this.selectedDate.set(day.date);
	}

	@HostListener("document:keydown.escape")
	clearSelection(event?: MouseEvent) {
		if (this.selectedDate()) event?.preventDefault();
		this.selectedDate.set(undefined);
	}

	setSelectionHover(day: CalendarDay) {
		this.hoverDate.set(day.date);
	}

	emitSelected() {
		if (!this.selection) return;
	}

	getEventLeft(event: CalendarEvent<SDK.CPVEventResponseWithLinks | SDK.EventResponseWithLinks>, row: CalendarRow) {
		return event.dateFrom.diff(row.days[0].date, "days").days / row.days.length;
	}

	getEventWidth(
		event: CalendarEvent<SDK.CPVEventResponseWithLinks | SDK.EventResponseWithLinks>,
		month: CalendarRow,
	) {
		return (event.dateTill.diff(event.dateFrom, "days").days + 1) / month.days.length;
	}

	getEventTooltip(event: SDK.EventResponseWithLinks): string {
		return event.name;
	}
}
