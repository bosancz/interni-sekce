import { Component, input, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";
import { PopoverController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { calendarSharp, heartSharp, homeSharp } from "ionicons/icons";
import { map } from "rxjs";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { UserService } from "src/app/core/services/user.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageFooterComponent } from "src/app/shared/components/page-footer/page-footer.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { TabComponent } from "src/app/shared/components/tab/tab.component";
import { TabsComponent } from "src/app/shared/components/tabs/tabs.component";
import { AccountMenuModalComponent } from "../../../../core/components/account-menu-modal/account-menu-modal.component";
import { ProgramPrintModalComponent } from "../../../program/components/program-print-modal/program-print-modal.component";
import { HomeCalendarComponent } from "../../components/home-calendar/home-calendar.component";
import { HomeDashboardComponent } from "../../components/home-dashboard/home-dashboard.component";
import { HomeMyComponent } from "../../components/home-my/home-my.component";

@Component({
	selector: "bo-home",

	templateUrl: "./home.component.html",
	styleUrl: "./home.component.scss",
	imports: [
		PageContentComponent,
		PageHeaderComponent,
		HomeDashboardComponent,
		HomeCalendarComponent,
		HomeMyComponent,
		PageFooterComponent,
		TabsComponent,
		TabComponent,
	],
})
export class HomeComponent {
	months = input<number>(1);

	view = signal("dashboard");

	user = this.userService.user;

	isLg = toSignal(this.platformService.isLg);

	title = toSignal(
		this.api.info.pipe(map((info) => "Bošán" + (info.environmentTitle ? ` ${info.environmentTitle}` : ""))),
	);

	actions = signal<Action[]>([
		{
			text: "Tisk programu",
			icon: "print-outline",
			pinned: true,
			handler: () => this.openPrintModal(),
		},
	]);

	constructor(
		private readonly api: ApiService,
		private readonly userService: UserService,
		public readonly popoverController: PopoverController,
		private readonly platformService: PlatformService,
		private readonly route: ActivatedRoute,
		private readonly modalService: ModalService,
	) {
		route.queryParams.subscribe((params) => this.view.set(params["tab"] || "dashboard"));

		addIcons({ homeSharp, calendarSharp, heartSharp });
	}

	async openPrintModal() {
		await this.modalService.componentModal(ProgramPrintModalComponent);
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
