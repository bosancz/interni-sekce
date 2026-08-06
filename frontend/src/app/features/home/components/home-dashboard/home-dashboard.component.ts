import { Component, computed, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonIcon, PopoverController } from "@ionic/angular/standalone";
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
import { HomeCardNoleaderEventsComponent } from "../home-card-noleader-events/home-card-noleader-events.component";
import { HomeCardTopLeadersComponent } from "../home-card-top-leaders/home-card-top-leaders.component";

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
		HomeCardTopLeadersComponent,
		PageContentComponent,
		ButtonSquareComponent,
		IonIcon,
		RouterLink,
	],
})
export class HomeDashboardComponent implements OnInit {
	view = signal("home");

	currentMonth = signal(DateTime.local().startOf("month"));

	dateFrom = computed(() => this.currentMonth().startOf("month"));
	dateTill = computed(() => this.currentMonth().endOf("month"));

	monthTitle = computed(() => `${months[this.currentMonth().month - 1]} ${this.currentMonth().year}`);

	events = signal<SDK.EventResponseWithLinks[]>([]);

	user = this.userService.user;

	constructor(
		private api: ApiService,
		private userService: UserService,
		public popoverController: PopoverController,
	) {
		addIcons({ chevronBackOutline, chevronForwardOutline });
	}

	ngOnInit(): void {
		this.loadCalendarEvents();
	}

	previousMonth() {
		this.currentMonth.update((month) => month.minus({ months: 1 }));
	}

	nextMonth() {
		this.currentMonth.update((month) => month.plus({ months: 1 }));
	}

	async loadCalendarEvents() {
		const events = await this.api.EventsApi.listEvents().then((res: any) => res.data);
		this.events.set(events);
	}
}
