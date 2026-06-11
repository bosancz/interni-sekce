import { Component, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from "@angular/router";
import {
	AlertController,
	IonIcon,
	IonTabBar,
	IonTabButton,
	IonToolbar,
	ViewWillEnter,
	ViewWillLeave,
} from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { callOutline, heartOutline, personCircleOutline } from "ionicons/icons";
import { MembershipStates } from "src/app/core/config/membership-states";
import { ApiService } from "src/app/core/services/api.service";
import { TitleService } from "src/app/core/services/title.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageFooterComponent } from "src/app/shared/components/page-footer/page-footer.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";
import { MemberAddressComponent } from "../../components/member-address/member-address.component";
import { MemberContactComponent } from "../../components/member-contact/member-contact.component";
import MemberContactsComponent from "../../components/member-contacts/member-contacts.component";
import { MemberHealthComponent } from "../../components/member-health/member-health.component";
import { MemberInfoComponent } from "../../components/member-info/member-info.component";
import { MemberMembershipComponent } from "../../components/member-membership/member-membership.component";
import { MemberProfileComponent } from "../../components/member-profile/member-profile.component";

@UntilDestroy()
@Component({
	selector: "members-view",
	templateUrl: "./members-view.component.html",
	styleUrls: ["./members-view.component.scss"],
	imports: [
		IonToolbar,
		IonTabBar,
		IonTabButton,
		IonIcon,
		RouterLink,
		RouterLinkActive,
		PageHeaderComponent,
		PageContentComponent,
		PageFooterComponent,
		MemberProfileComponent,
		MemberInfoComponent,
		MemberContactComponent,
		MemberAddressComponent,
		MemberMembershipComponent,
		MemberHealthComponent,
		MemberContactsComponent,
	],
})
export class MembersViewComponent implements OnInit, ViewWillEnter, ViewWillLeave {
	member = signal<SDK.MemberResponseWithLinks | undefined>(undefined);
	view?: "info" | "health" | "contacts" | "profile" = "info";

	membershipStates = MembershipStates;

	actions: Action[] = [
		{
			text: "Smazat",
			role: "destructive",
			icon: "trash",
			color: "danger",
			handler: () => this.delete(),
		},
	];

	constructor(
		private api: ApiService,
		private toastService: ToastService,
		private route: ActivatedRoute,
		private router: Router,
		private alertController: AlertController,
		private titleService: TitleService,
	) {
		addIcons({ personCircleOutline, heartOutline, callOutline });
	}

	ngOnInit() {
		this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
			if (this.member()?.id !== parseInt(params.member)) this.loadMember(parseInt(params.member));
		});

		this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => {
			if (params.view) {
				this.view = params.view;
			} else {
				this.router.navigate([], {
					relativeTo: this.route,
					queryParams: { view: "profile" },
					replaceUrl: true,
				});
			}
		});
	}

	ionViewWillEnter(): void {}

	ionViewWillLeave(): void {}

	async loadMember(id: number) {
		const member = await this.api.MembersApi.getMember(id).then((res) => res.data);
		this.titleService.setTitle(member?.nickname ?? null);

		this.member.set(member);
	}

	async reloadMember() {
		const member = this.member();
		if (member) await this.loadMember(member.id);
	}

	async updateMember(data: SDK.MemberUpdateBody) {
		if (!this.member()) return;

		const toast = await this.toastService.toast("Ukládám...");

		this.member.set({ ...this.member()!, ...data });

		try {
			await this.api.MembersApi.updateMember(this.member()!.id, data);

			toast.dismiss();
			this.toastService.toast("Uloženo.");
		} catch (e) {
			toast.dismiss();
			this.toastService.toast("Chyba při ukládání.", { color: "danger" });
		}

		await this.loadMember(this.member()!.id);
	}

	async delete() {
		if (!this.member()) return;

		const alert = await this.alertController.create({
			header: "Smazat člena?",
			message: `Opravdu chcete smazat člena „<strong>${this.getFullName(this.member()!)}</strong>“?`,
			buttons: [{ text: "Zrušit" }, { text: "Smazat", handler: () => this.deleteConfirmed() }],
		});

		await alert.present();
	}

	async deleteConfirmed() {
		if (!this.member()) return;

		await this.api.MembersApi.deleteMember(this.member()!.id);

		this.toastService.toast(`Člen ${this.member()!.nickname} smazán.`);

		this.router.navigate(["../"], { relativeTo: this.route, replaceUrl: true });
	}

	getFullName(member?: SDK.MemberResponseWithLinks | null) {
		if (!member) return "";
		return (
			member.nickname +
			(member?.firstName || member.lastName ? ` (${member?.firstName} ${member?.lastName})` : "")
		);
	}

	getAge(member?: SDK.MemberResponseWithLinks) {}
}
