import { Component, computed, signal } from "@angular/core";
import { IonIcon, PopoverController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { chevronUp } from "ionicons/icons";
import { AccountMenuModalComponent } from "src/app/core/components/account-menu-modal/account-menu-modal.component";
import { NotificationsService } from "src/app/core/services/notifications.service";
import { UserService } from "src/app/core/services/user.service";
import { AvatarComponent } from "src/app/shared/components/avatar/avatar.component";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";
import { MemberProfilePhotoUrlPipe } from "src/app/shared/pipes/member-profile-photo-url.pipe";

@Component({
	selector: "bo-account-card",
	templateUrl: "./account-card.component.html",
	styleUrl: "./account-card.component.scss",
	imports: [IonIcon, AvatarComponent, MemberPipe, MemberProfilePhotoUrlPipe, GroupPipe],
})
export class AccountCardComponent {
	user = this.userService.currentUser;

	name = computed(() => {
		const user = this.user();
		const member = user?.member;
		const fullName = [member?.firstName, member?.lastName].filter(Boolean).join(" ");
		return fullName || member?.nickname || user?.login || "";
	});

	unreadCount = this.notificationsService.unreadCount;

	open = signal(false);

	constructor(
		private readonly userService: UserService,
		private readonly popoverController: PopoverController,
		private readonly notificationsService: NotificationsService,
	) {
		addIcons({ chevronUp });
	}

	async toggle(e: Event) {
		if (this.open()) {
			await this.popoverController.dismiss();
			return;
		}

		const card = e.currentTarget as HTMLElement;

		const popover = await this.popoverController.create({
			component: AccountMenuModalComponent,
			event: new CustomEvent("click", { detail: { ionShadowTarget: card } }),
			size: "cover",
			side: "top",
			alignment: "start",
			cssClass: "account-card-popover",
			showBackdrop: false,
		});

		this.open.set(true);
		popover.onDidDismiss().then(() => this.open.set(false));

		await popover.present();
	}
}
