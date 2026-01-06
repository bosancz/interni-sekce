import { Component, input, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";
import { PopoverController } from "@ionic/angular";
import { map } from "rxjs";
import { ApiService } from "src/app/services/api.service";
import { PlatformService } from "src/app/services/platform.service";
import { UserService } from "src/app/services/user.service";
import { AccountMenuModalComponent } from "../../../../components/account-menu-modal/account-menu-modal.component";

@Component({
	selector: "bo-home",
	standalone: true,
	templateUrl: "./home.component.html",
	styleUrl: "./home.component.scss",
	imports: [],
})
export class HomeComponent {
	months = input<number>(1);

	view = signal("dashboard");

	user = this.userService.user;

	isLg = toSignal(this.platformService.isLg);

	title = toSignal(
		this.api.info.pipe(map((info) => "Bošán" + (info.environmentTitle ? ` ${info.environmentTitle}` : ""))),
	);

	constructor(
		private readonly api: ApiService,
		private readonly userService: UserService,
		public readonly popoverController: PopoverController,
		private readonly platformService: PlatformService,
		private readonly route: ActivatedRoute,
	) {
		route.queryParams.subscribe((params) => this.view.set(params["tab"] || "dashboard"));
	}

	async openAccountMenu(e: Event) {
		const popover = await this.popoverController.create({
			translucent: true,
			component: AccountMenuModalComponent,
			event: e,
		});

		await popover.present();
	}
}
