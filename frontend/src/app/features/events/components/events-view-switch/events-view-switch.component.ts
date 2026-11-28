import { Component, input } from "@angular/core";
import { IonIcon, NavController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { calendarOutline, bonfireOutline } from "ionicons/icons";
import { TabComponent } from "src/app/shared/components/tab/tab.component";
import { TabsComponent } from "src/app/shared/components/tabs/tabs.component";

export type EventsView = "events" | "camps";

const EVENTS_VIEWS: { name: EventsView; label: string; icon: string; url: string }[] = [
	{ name: "events", label: "Akce", icon: "calendar-outline", url: "/akce" },
	{ name: "camps", label: "Tábory", icon: "bonfire-outline", url: "/akce/tabory" },
];

@Component({
	selector: "bo-events-view-switch",
	templateUrl: "./events-view-switch.component.html",
	styleUrl: "./events-view-switch.component.scss",
	imports: [TabsComponent, TabComponent, IonIcon],
})
export class EventsViewSwitchComponent {
	active = input.required<EventsView>();
	variant = input<"header" | "tabs">("header");

	views = EVENTS_VIEWS;

	constructor(private navController: NavController) {
		addIcons({ calendarOutline, bonfireOutline });
	}

	open(view: (typeof EVENTS_VIEWS)[number]) {
		if (view.name === this.active()) return;
		this.navController.navigateRoot(view.url, { animated: false });
	}
}
