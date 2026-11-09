import { Component, input, output, signal } from "@angular/core";
import { IonContent, IonIcon, IonPopover } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmark } from "ionicons/icons";

export interface DropdownMenuOption<T = string> {
	value: T;
	label: string;
	description?: string;
	bold?: boolean;
	prefix?: string;
	divider?: boolean;
	icon?: string;
	danger?: boolean;
}

@Component({
	selector: "bo-dropdown-menu",
	templateUrl: "./dropdown-menu.component.html",
	imports: [IonPopover, IonContent, IonIcon],
})
export class DropdownMenuComponent<T = string> {
	options = input<DropdownMenuOption<T>[]>([]);
	value = input<T | null | undefined>();
	header = input<string>();
	select = output<T>();

	isOpen = signal(false);
	triggerEvent = signal<Event | undefined>(undefined);

	constructor() {
		addIcons({ checkmark });
	}

	open(event: Event) {
		event.stopPropagation();
		this.triggerEvent.set(event);
		this.isOpen.set(true);
	}

	choose(option: DropdownMenuOption<T>) {
		this.isOpen.set(false);
		if (option.value !== this.value()) this.select.emit(option.value);
	}
}
