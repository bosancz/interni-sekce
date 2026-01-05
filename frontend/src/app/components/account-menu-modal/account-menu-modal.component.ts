import { Component } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { PlatformService } from "src/app/services/platform.service";

@Component({
	selector: "bo-account-menu-modal",
	standalone: false,
	templateUrl: "./account-menu-modal.component.html",
	styleUrl: "./account-menu-modal.component.scss",
})
export class AccountMenuModalComponent {
	isLg = toSignal(this.platformService.isLg);

	constructor(private readonly platformService: PlatformService) {}
}
