import { NgTemplateOutlet } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
	InfiniteScrollCustomEvent,
	IonButton,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonItem,
	IonLabel,
} from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { calendarOutline, createOutline, helpCircleOutline, hourglassOutline } from "ionicons/icons";
import { BehaviorSubject } from "rxjs";
import { filter, map } from "rxjs/operators";
import { ApiService } from "src/app/core/services/api.service";
import { EventCardComponent } from "src/app/shared/components/event-card/event-card.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageFooterComponent } from "src/app/shared/components/page-footer/page-footer.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { TabComponent } from "src/app/shared/components/tab/tab.component";
import { TabsComponent } from "src/app/shared/components/tabs/tabs.component";
import { SDK } from "src/sdk";
import { ProgramService } from "../../services/program.service";

@UntilDestroy()
@Component({
	selector: "program-workflow",
	templateUrl: "./program-workflow.component.html",
	styleUrls: ["./program-workflow.component.scss"],

	imports: [
		NgTemplateOutlet,
		IonLabel,
		IonItem,
		IonButton,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		EventCardComponent,
		PageHeaderComponent,
		PageContentComponent,
		PageFooterComponent,
		TabsComponent,
		TabComponent,
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
					(event) =>
						["draft", "rejected"].indexOf(event.status) !== -1 && event.leaders && event.leaders.length,
				),
			),
		),
		{ initialValue: [] },
	);
	pendingEvents = toSignal(this.events.pipe(map((events) => events?.filter((event) => event.status === "pending"))), {
		initialValue: [],
	});
	publicEvents = toSignal(
		this.events.pipe(
			map((events) => events?.filter((event) => ["public", "cancelled"].indexOf(event.status) !== -1)),
		),
		{ initialValue: [] },
	);

	loading = signal(true);
	reachedEnd = signal(false);

	page = 1;
	readonly pageSize = 50;

	constructor(
		private api: ApiService,
		private programService: ProgramService,
	) {
		addIcons({ helpCircleOutline, createOutline, hourglassOutline, calendarOutline });
	}

	ngOnInit() {
		this.loadEvents();
		// Subscribe to the BehaviorSubject instead of the signal
		this.events
			.pipe(untilDestroyed(this))
			.pipe(
				map((events) => events?.filter((event) => event.status === "pending")),
				filter((events) => events !== undefined),
			)
			.subscribe((events: SDK.EventResponseWithLinks[]) =>
				this.programService.pendingEventsCount.next(events.length),
			);
	}

	async loadEvents(loadMore = false) {
		if (loadMore) {
			if (this.reachedEnd()) return;
			this.page++;
		} else {
			this.page = 1;
			this.reachedEnd.set(false);
			this.events.next([]);
			this.loading.set(true);
		}

		const events = await this.api.EventsApi.listEvents({
			offset: (this.page - 1) * this.pageSize,
			limit: this.pageSize,
		}).then((res) => res.data);

		if (events.length < this.pageSize) this.reachedEnd.set(true);

		this.events.next([...(this.events.value ?? []), ...events]);

		this.loading.set(false);
	}

	async onInfiniteScroll(e: InfiniteScrollCustomEvent) {
		await this.loadEvents(true);
		e.target.complete();
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
