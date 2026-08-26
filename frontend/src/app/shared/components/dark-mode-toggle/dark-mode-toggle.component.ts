import { Component } from "@angular/core";
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
	status = this.darkModeService.status;

	constructor(private darkModeService: DarkModeService) {
		addIcons({ sunny, moon });
	}

	setDarkMode(event: ToggleCustomEvent) {
		this.darkModeService.setDarkMode(event.detail.checked);
	}
}
