import { Component, computed, effect, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonIcon, IonSpinner, PopoverController } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { chevronBackOutline, chevronForwardOutline } from "ionicons/icons";
import { DateTime } from "luxon";
import { ApiService } from "src/app/core/services/api.service";
import { UserService } from "src/app/core/services/user.service";
import { ButtonSquareComponent } from "src/app/shared/components/button-square/button-square.component";
import { EventCalendarComponent } from "src/app/shared/components/event-calendar/event-calendar.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { SDK } from "src/sdk";
import { HomeCardMyEventsComponent } from "../home-card-my-events/home-card-my-events.component";
import { HomeCardPhotoOfDayComponent } from "../home-card-photo-of-day/home-card-photo-of-day.component";
import { HomeCardNoleaderEventsComponent } from "../home-card-noleader-events/home-card-noleader-events.component";

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

@UntilDestroy()
@Component({
	selector: "bo-home-dashboard",
	templateUrl: "./home-dashboard.component.html",
	styleUrls: ["./home-dashboard.component.scss"],
	imports: [
		EventCalendarComponent,
		HomeCardMyEventsComponent,
		HomeCardNoleaderEventsComponent,
		HomeCardPhotoOfDayComponent,
		PageContentComponent,
		ButtonSquareComponent,
		IonIcon,
		IonSpinner,
		RouterLink,
	],
})
export class HomeDashboardComponent {
	view = signal("home");

	currentMonth = signal(DateTime.local().startOf("month"));

	dateFrom = computed(() => this.currentMonth().startOf("month"));
	dateTill = computed(() => this.currentMonth().endOf("month"));

	monthTitle = computed(() => `${months[this.currentMonth().month - 1]} ${this.currentMonth().year}`);

	events = signal<SDK.EventResponseWithLinks[]>([]);
	loading = signal(false);

	user = this.userService.user;

	canAccessProgram = this.userService.canAccessProgram;
	canAccessTreasurer = this.userService.canAccessTreasurer;

	constructor(
		private api: ApiService,
		private userService: UserService,
		public popoverController: PopoverController,
	) {
		addIcons({ chevronBackOutline, chevronForwardOutline });

		effect(() => this.loadCalendarEvents(this.dateFrom(), this.dateTill()));
	}

	previousMonth() {
		this.currentMonth.update((month) => month.minus({ months: 1 }));
	}

	nextMonth() {
		this.currentMonth.update((month) => month.plus({ months: 1 }));
	}

	private calendarRequest = 0;

	async loadCalendarEvents(dateFrom: DateTime, dateTill: DateTime) {
		const request = ++this.calendarRequest;
		this.loading.set(true);
		try {
			const events = await this.api.EventsApi.listEvents({
				dateFrom: dateFrom.toISODate()!,
				dateTill: dateTill.toISODate()!,
			}).then((res) => res.data);
			if (request === this.calendarRequest) this.events.set(events);
		} finally {
			if (request === this.calendarRequest) this.loading.set(false);
		}
	}
}
