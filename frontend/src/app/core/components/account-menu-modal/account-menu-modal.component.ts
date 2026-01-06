import { Component } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { PlatformService } from "src/app/services/platform.service";
import { DarkModeToggleComponent } from "src/app/shared/components/dark-mode-toggle/dark-mode-toggle.component";
import { VersionComponent } from "src/app/shared/components/version/version.component";
import { AccountMenuComponent } from "../account-menu/account-menu.component";

@Component({
	selector: "bo-account-menu-modal",
	templateUrl: "./account-menu-modal.component.html",
	styleUrl: "./account-menu-modal.component.scss",
	imports: [AccountMenuComponent, DarkModeToggleComponent, VersionComponent],
})
export class AccountMenuModalComponent {
	isLg = toSignal(this.platformService.isLg);

	constructor(private readonly platformService: PlatformService) {}
}
