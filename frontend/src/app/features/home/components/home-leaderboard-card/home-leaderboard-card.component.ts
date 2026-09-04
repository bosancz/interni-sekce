import { Component, input, output, signal } from "@angular/core";
import { IonContent, IonIcon, IonPopover } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { chevronBackOutline, chevronForwardOutline, informationCircleOutline } from "ionicons/icons";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";

@Component({
	selector: "bo-home-leaderboard-card",
	templateUrl: "./home-leaderboard-card.component.html",
	styleUrls: ["./home-leaderboard-card.component.scss"],

	imports: [
		IonContent,
		IonIcon,
		IonPopover,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
	],
})
export class HomeLeaderboardCardComponent {
	title = input.required<string>();

	year = input.required<number>();
	canGoBack = input(false);
	canGoForward = input(false);

	infoTitle = input.required<string>();
	infoLines = input.required<string[]>();

	previousYear = output<void>();
	nextYear = output<void>();

	infoOpen = signal(false);
	infoEvent = signal<Event | undefined>(undefined);

	constructor() {
		addIcons({ chevronBackOutline, chevronForwardOutline, informationCircleOutline });
	}

	openInfo(event: Event) {
		this.infoEvent.set(event);
		this.infoOpen.set(true);
	}
}
