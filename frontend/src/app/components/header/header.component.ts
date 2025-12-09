import { Component, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { PopoverController } from "@ionic/angular";
import { map } from "rxjs";
import { AccountMenuModalComponent } from "src/app/components/account-menu-modal/account-menu-modal.component";
import { ApiService } from "src/app/services/api.service";
import { PlatformService } from "src/app/services/platform.service";
import { UserService } from "src/app/services/user.service";

@Component({
	selector: "bo-header",
	standalone: false,
	templateUrl: "./header.component.html",
	styleUrl: "./header.component.scss",
})
export class HeaderComponent {
	showSearch = signal(false);

	user = this.userService.user;

	isLg = toSignal(this.platformService.isLg);

	environment = toSignal(this.api.info.pipe(map((info) => info.environmentTitle || "")));

	constructor(
		private readonly api: ApiService,
		private readonly userService: UserService,
		public readonly popoverController: PopoverController,
		private readonly platformService: PlatformService,
	) {}

	async openAccountMenu(e: Event) {
		const popover = await this.popoverController.create({
			translucent: true,
			component: AccountMenuModalComponent,
			event: e,
		});

		await popover.present();
	}
}
