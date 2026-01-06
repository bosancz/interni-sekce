import { Component, OnInit, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { BehaviorSubject } from "rxjs";
import { filter, map } from "rxjs/operators";
import { DateTime } from "luxon";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonTabBar, IonTabButton, IonText, IonLabel, IonItem, IonButton } from "@ionic/angular/standalone";
import { NgTemplateOutlet } from "@angular/common";
import { ApiService } from "src/app/services/api.service";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { EventCardComponent } from "src/app/shared/components/event-card/event-card.component";
import { SDK } from "src/sdk";
import { ProgramService } from "../../services/program.service";

@UntilDestroy()
@Component({
	selector: "program-workflow",
	templateUrl: "./program-workflow.component.html",
	styleUrls: ["./program-workflow.component.scss"],
	standalone: true,
	imports: [
		NgTemplateOutlet,
		IonContent,
		IonHeader,
		IonToolbar,
		IonButtons,
		IonBackButton,
		IonTitle,
		IonTabBar,
		IonTabButton,
		IonText,
		IonLabel,
		IonItem,
		IonButton,
		PageHeaderComponent,
		EventCardComponent,
	],
})
export class ProgramWorkflowComponent implements OnInit {
	selectedColumn = signal("pending");

	events = new BehaviorSubject<undefined | SDK.EventResponseWithLinks[]>([]);

	noLeaderEvents = toSignal(
		this.events.pipe(
			map((events) =>
				events?.filter(
					(event) =>
						["draft", "rejected"].indexOf(event.status) !== -1 && (!event.leaders || !event.leaders.length),
				),
			),
		),
		{ initialValue: [] },
	);
	draftEvents = toSignal(
		this.events.pipe(
			map((events) =>
				events?.filter(
					(event) => ["draft", "rejected"].indexOf(event.status) !== -1 && event.leaders && event.leaders.length,
				),
			),
		),
		{ initialValue: [] },
	);
	pendingEvents = toSignal(
		this.events.pipe(map((events) => events?.filter((event) => event.status === "pending"))),
		{ initialValue: [] },
	);
	publicEvents = toSignal(
		this.events.pipe(
			map((events) => events?.filter((event) => ["public", "cancelled"].indexOf(event.status) !== -1)),
		),
		{ initialValue: [] },
	);

	loading = signal(true);

	constructor(
		private api: ApiService,
		private programService: ProgramService,
	) {}

	ngOnInit() {
		this.loadEvents();
		this.pendingEvents
			.pipe(untilDestroyed(this))
			.pipe(filter((events) => events !== undefined))
			.subscribe((events) => this.programService.pendingEventsCount.next(events!.length));
	}

	async loadEvents() {
		this.loading.set(true);

		const options = {
			limit: 100,
			filter: {
				dateFrom: { $gte: DateTime.local().toISODate() },
			},
			sort: "dateFrom",
			select: "_id status statusNote name description dateFrom dateTill leaders subtype",
		};

		// TODO: use options above
		const events = await this.api.EventsApi.listEvents().then((res) => res.data);

		this.events.next(events);

		this.loading.set(false);
	}

	eventChanged(newEvent: SDK.EventResponseWithLinks) {
		const events = this.events.value || [];
		const i = events.findIndex((event) => event.id === newEvent.id);
		if (i >= 0) {
			events.splice(i, 1, newEvent);
		} else {
			events.push(newEvent);
		}
		this.events.next(events);
	}
}
