import { Component } from "@angular/core";
import { PopoverController } from "@ionic/angular/standalone";
import { AccountMenuModalComponent } from "src/app/core/components/account-menu-modal/account-menu-modal.component";
import { UserService } from "src/app/core/services/user.service";
import { AvatarComponent } from "src/app/shared/components/avatar/avatar.component";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";

@Component({
	selector: "bo-account-menu",
	templateUrl: "./account-menu.component.html",
	styleUrl: "./account-menu.component.scss",
	imports: [AvatarComponent, MemberPipe, GroupPipe],
})
export class AccountMenuComponent {
	user = this.userService.currentUser;

	constructor(
		private readonly userService: UserService,
		private readonly popoverController: PopoverController,
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
