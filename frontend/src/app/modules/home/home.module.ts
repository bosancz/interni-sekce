import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SharedModule } from "src/app/shared/shared.module";
import { AccountMenuComponent } from "./components/account-menu/account-menu.component";
import { DarkModeToggleComponent } from "./components/dark-mode-toggle/dark-mode-toggle.component";
import { HomeCalendarComponent } from "./components/home-calendar/home-calendar.component";
import { HomeCardMyEventsComponent } from "./components/home-card-my-events/home-card-my-events.component";
import { HomeCardNoleaderEventsComponent } from "./components/home-card-noleader-events/home-card-noleader-events.component";
import { HomeCardSearchMemberComponent } from "./components/home-card-search-member/home-card-search-member.component";
import { HomeDashboardComponent } from "./components/home-dashboard/home-dashboard.component";
import { HomeMemberSearchComponent } from "./components/home-member-search/home-member-search.component";
import { HomeMenuComponent } from "./components/home-menu/home-menu.component";
import { HomeMyComponent } from "./components/home-my/home-my.component";
import { HomeRoutingModule } from "./home-routing.module";
import { HomeComponent } from "./pages/home/home.component";

@NgModule({
	declarations: [
		HomeDashboardComponent,
		HomeMenuComponent,
		HomeCardNoleaderEventsComponent,
		HomeCalendarComponent,
		HomeCardMyEventsComponent,
		HomeMemberSearchComponent,
		HomeCardSearchMemberComponent,
		DarkModeToggleComponent,
		AccountMenuComponent,
		HomeComponent,
		HomeMyComponent,
	],
	imports: [CommonModule, HomeRoutingModule, SharedModule],
})
export class DashboardModule {}
