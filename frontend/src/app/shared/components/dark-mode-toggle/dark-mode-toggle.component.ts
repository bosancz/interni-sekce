import { Component, signal } from "@angular/core";
import { IonIcon, IonToggle, ToggleCustomEvent } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { moon, sunny } from "ionicons/icons";
import { DarkModeService } from "src/app/core/services/dark-mode.service";

@Component({
	selector: "bo-dark-mode-toggle",
	templateUrl: "./dark-mode-toggle.component.html",
	styleUrls: ["./dark-mode-toggle.component.scss"],
	imports: [IonIcon, IonToggle],
})
export class DarkModeToggleComponent {
	status = signal<boolean | undefined>(undefined);

	constructor(private darkModeService: DarkModeService) {
		addIcons({ sunny, moon });
	}

	ngOnInit(): void {
		this.darkModeService.status.subscribe((value) => this.status.set(value ?? false));
	}

	setDarkMode(event: ToggleCustomEvent) {
		this.darkModeService.setDarkMode(event.detail.checked);
	}
}
