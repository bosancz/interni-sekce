import { AsyncPipe } from "@angular/common";
import { Component, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import {
    IonButton,
    IonButtons,
    IonHeader,
    IonIcon,
    IonSearchbar,
    IonToolbar,
    PopoverController,
} from "@ionic/angular/standalone";
import { map } from "rxjs";
import { AccountMenuModalComponent } from "src/app/core/components/account-menu-modal/account-menu-modal.component";
import { ApiService } from "src/app/core/services/api.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { UserService } from "src/app/core/services/user.service";
import { AvatarComponent } from "src/app/shared/components/avatar/avatar.component";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";

@Component({
	selector: "bo-header",
	templateUrl: "./header.component.html",
	styleUrl: "./header.component.scss",
	imports: [
		AvatarComponent,
		RouterLink,
		IonSearchbar,
		IonHeader,
		IonToolbar,
		IonButtons,
		IonButton,
		IonIcon,
		MemberPipe,
		GroupPipe,
		AsyncPipe,
	],
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
