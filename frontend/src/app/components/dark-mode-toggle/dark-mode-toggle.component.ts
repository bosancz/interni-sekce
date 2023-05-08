import { Component } from "@angular/core";
import { ToggleCustomEvent } from "@ionic/angular";
import { DarkModeService } from "src/app/services/dark-mode.service";

@Component({
  selector: "bo-dark-mode-toggle",
  templateUrl: "./dark-mode-toggle.component.html",
  styleUrls: ["./dark-mode-toggle.component.scss"],
})
export class DarkModeToggleComponent {
  status?: boolean;

  constructor(private darkModeService: DarkModeService) {}

  ngOnInit(): void {
    this.darkModeService.status.subscribe((value) => (this.status = value ?? false));
  }

  setDarkMode(event: ToggleCustomEvent) {
    this.darkModeService.setDarkMode(event.detail.checked);
  }
}
