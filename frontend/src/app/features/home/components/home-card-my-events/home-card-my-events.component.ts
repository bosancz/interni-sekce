import { DatePipe, SlicePipe } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonItem, IonLabel, IonList, IonSkeletonText } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardOpenButtonComponent } from "src/app/shared/components/card-open-button/card-open-button.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-home-card-my-events",
	templateUrl: "./home-card-my-events.component.html",
	styleUrls: ["./home-card-my-events.component.scss"],

	imports: [
		RouterLink,
		DatePipe,
		SlicePipe,
		IonList,
		IonItem,
		IonLabel,
		IonSkeletonText,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardOpenButtonComponent,
		CardContentComponent,
	],
})
export class HomeCardMyEventsComponent implements OnInit {
	myEvents = signal<SDK.EventResponseWithLinks[] | undefined>(undefined);

	constructor(private api: ApiService) {}

	ngOnInit(): void {
		this.loadMyEvents();
	}

	async loadMyEvents() {
		// TODO: list only my events
		const events = await this.api.EventsApi.listEvents({ my: true }).then((res) => res.data);
		events.sort((a, b) => b.dateFrom.localeCompare(a.dateFrom));
		this.myEvents.set(events);
	}
}
