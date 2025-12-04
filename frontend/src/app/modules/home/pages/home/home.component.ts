import { Component, Input, signal } from "@angular/core";
import { PopoverController } from "@ionic/angular";
import { map } from "rxjs";
import { ApiService } from "src/app/services/api.service";
import { UserService } from "src/app/services/user.service";
import { AccountMenuComponent } from "../../components/account-menu/account-menu.component";

@Component({
	selector: "bo-home",
	standalone: false,
	templateUrl: "./home.component.html",
	styleUrl: "./home.component.scss",
})
export class HomeComponent {
	@Input() months: number = 1;

	view = signal("dashboard");

	user = this.userService.user;

	title = this.api.info.pipe(map((info) => "Bošán" + (info.environmentTitle ? ` ${info.environmentTitle}` : "")));

	constructor(
		private api: ApiService,
		private userService: UserService,
		public popoverController: PopoverController,
	) {}

	async openAccountMenu(e: Event) {
		const popover = await this.popoverController.create({
			translucent: true,
			component: AccountMenuComponent,
			event: e,
		});

		await popover.present();
	}
}
