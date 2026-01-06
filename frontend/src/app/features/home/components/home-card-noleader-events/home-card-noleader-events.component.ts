import { DatePipe } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonItem, IonLabel, IonList } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { ButtonComponent } from "src/app/shared/components/button/button.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardOpenButtonComponent } from "src/app/shared/components/card-open-button/card-open-button.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-home-card-noleader-events",
	templateUrl: "./home-card-noleader-events.component.html",
	styleUrls: ["./home-card-noleader-events.component.scss"],

	imports: [
		RouterLink,
		DatePipe,
		IonList,
		IonItem,
		IonLabel,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardOpenButtonComponent,
		CardContentComponent,
		ButtonComponent,
	],
})
export class HomeCardNoleaderEventsComponent implements OnInit {
	events = signal<SDK.EventResponseWithLinks[]>([]);
	hasMore = signal(false);

	constructor(private api: ApiService) {}

	ngOnInit(): void {
		this.loadNoLeaderEvents();
	}

	async loadNoLeaderEvents() {
		// TODO: list only noleader events
		const events = await this.api.EventsApi.listEvents({ limit: 6, noleader: true }).then((res) => res.data);
		this.hasMore.set(events.length > 5);
		this.events.set(events.slice(0, 5));
	}
}
