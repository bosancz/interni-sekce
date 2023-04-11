import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SharedModule } from "src/app/shared/shared.module";
import { HomeCalendarComponent } from "./components/home-calendar/home-calendar.component";
import { HomeCardContentComponent } from "./components/home-card-content/home-card-content.component";
import { HomeCardMembersComponent } from "./components/home-card-members/home-card-members.component";
import { HomeCardMyEventsComponent } from "./components/home-card-my-events/home-card-my-events.component";
import { HomeCardTitleComponent } from "./components/home-card-title/home-card-title.component";
import { HomeCardComponent } from "./components/home-card/home-card.component";
import { HomeMenuComponent } from "./components/home-menu/home-menu.component";
import { NoleaderEventsComponent } from "./components/noleader-events/noleader-events.component";
import { HomeRoutingModule } from "./home-routing.module";
import { HomeDashboardComponent } from "./pages/home-dashboard/home-dashboard.component";
import { HomeMyEventsComponent } from "./pages/home-my-events/home-my-events.component";

@NgModule({
  declarations: [
    HomeDashboardComponent,
    HomeMyEventsComponent,
    HomeMenuComponent,
    NoleaderEventsComponent,
    HomeCalendarComponent,
    HomeCardMyEventsComponent,
    HomeCardMembersComponent,
    HomeCardComponent,
    HomeCardTitleComponent,
    HomeCardContentComponent,
  ],
  imports: [CommonModule, HomeRoutingModule, SharedModule],
})
export class DashboardModule {}
