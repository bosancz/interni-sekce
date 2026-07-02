import { Injectable } from "@angular/core";
import { shareReplay } from "rxjs";
import { LocalStorageService } from "./local-storage.service";

@Injectable({
	providedIn: "root",
})
export class DarkModeService {
	private readonly darkModeKey = "isDarkMode";

	readonly status = this.localStorage.watch<boolean>(this.darkModeKey).pipe(shareReplay(1));

	constructor(private localStorage: LocalStorageService) {
		this.status.subscribe((isDarkMode) => this.updateDarkMode(isDarkMode ?? false));
	}

	updateDarkMode(isDarkMode: boolean) {
		if (isDarkMode) {
			document.body.classList.add("dark");
		} else {
			document.body.classList.remove("dark");
		}
		// keep bootstrap utilities (.text-muted, borders, ...) in sync with the app theme
		document.body.setAttribute("data-bs-theme", isDarkMode ? "dark" : "light");
	}

	setDarkMode(isDarkMode: boolean) {
		this.localStorage.set(this.darkModeKey, isDarkMode);
	}
}
