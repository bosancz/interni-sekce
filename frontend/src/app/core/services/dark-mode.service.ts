import { effect, Injectable } from "@angular/core";
import { UserSettingsService } from "./user-settings.service";

@Injectable({
	providedIn: "root",
})
export class DarkModeService {
	readonly status = this.userSettings.watch("darkMode");

	constructor(private userSettings: UserSettingsService) {
		effect(() => this.updateDarkMode(this.status() ?? false));
	}

	updateDarkMode(isDarkMode: boolean) {
		if (isDarkMode) {
			document.body.classList.add("dark");
		} else {
			document.body.classList.remove("dark");
		}
		document.body.setAttribute("data-bs-theme", isDarkMode ? "dark" : "light");
	}

	setDarkMode(isDarkMode: boolean) {
		this.userSettings.set("darkMode", isDarkMode);
	}
}
