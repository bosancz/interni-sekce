import { Component, OnInit, signal } from "@angular/core";
import { Platform, PopoverController } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ApiService } from "src/app/services/api.service";
import { UserService } from "src/app/services/user.service";
import { AccountMenuComponent } from "../../components/account-menu/account-menu.component";

@UntilDestroy()
@Component({
	selector: "bo-home-dashboard",
	templateUrl: "./home-dashboard.component.html",
	styleUrls: ["./home-dashboard.component.scss"],
	standalone: false,
})
export class HomeDashboardComponent implements OnInit {
	isLg: boolean = false;

	view = signal("apps");

	isPortrait = this.platform.isPortrait();

	user = this.userService.user;

	constructor(
		private api: ApiService,
		private platform: Platform,
		private userService: UserService,
		public popoverController: PopoverController,
	) {}

	ngOnInit(): void {
		this.platform.resize.pipe(untilDestroyed(this)).subscribe(() => this.updateView());

		this.updateView();
	}

	updateView() {
		this.isLg = this.platform.width() >= 992;
	}

	async openAccountMenu(e: Event) {
		const popover = await this.popoverController.create({
			translucent: true,
			component: AccountMenuComponent,
			event: e,
		});

		await popover.present();
	}
}
