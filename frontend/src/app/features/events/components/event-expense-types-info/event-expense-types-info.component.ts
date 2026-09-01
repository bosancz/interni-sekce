import { Component, signal } from "@angular/core";
import { IonContent, IonIcon, IonPopover } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { informationCircleOutline } from "ionicons/icons";
import { EventExpenseTypes, EventExpenseTypesMetadata } from "src/app/core/config/event-expense-types";

/**
 * Malé "i" tlačítko, které v popoveru vysvětlí, co do které účetní kategorie výdajů patří.
 * Používá se u seznamu účtenek i ve formuláři účtenky, aby byla nápověda po ruce právě ve
 * chvíli, kdy se kategorie vybírá. Obsah se bere z EventExpenseTypes, takže se nová
 * kategorie objeví v nápovědě sama.
 */
@Component({
	selector: "bo-event-expense-types-info",
	templateUrl: "./event-expense-types-info.component.html",
	styleUrls: ["./event-expense-types-info.component.scss"],

	imports: [IonIcon, IonPopover, IonContent],
})
export class EventExpenseTypesInfoComponent {
	readonly types: EventExpenseTypesMetadata[] = Object.values(EventExpenseTypes);

	popoverOpen = signal(false);
	popoverEvent = signal<Event | undefined>(undefined);

	constructor() {
		addIcons({ informationCircleOutline });
	}

	open(event: Event) {
		// the button can sit inside a clickable row (expense modal item), so keep the
		// click from also triggering whatever is underneath
		event.stopPropagation();

		this.popoverEvent.set(event);
		this.popoverOpen.set(true);
	}
}
