import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SharedModule } from "src/app/shared/shared.module";
import { HomeCalendarComponent } from "./components/home-calendar/home-calendar.component";
import { HomeCardMyEventsComponent } from "./components/home-card-my-events/home-card-my-events.component";
import { HomeCardNoleaderEventsComponent } from "./components/home-card-noleader-events/home-card-noleader-events.component";
import { HomeChatComponent } from "./components/home-chat/home-chat.component";
import { HomeMemberSearchComponent } from "./components/home-member-search/home-member-search.component";
import { HomeCardMembersComponent } from "./components/home-members/home-card-members.component";
import { HomeMenuComponent } from "./components/home-menu/home-menu.component";
import { HomeRoutingModule } from "./home-routing.module";
import { HomeDashboardComponent } from "./pages/home-dashboard/home-dashboard.component";
import { HomeMyEventsComponent } from "./pages/home-my-events/home-my-events.component";

@NgModule({
  declarations: [
    HomeDashboardComponent,
    HomeMyEventsComponent,
    HomeMenuComponent,
    HomeCardNoleaderEventsComponent,
    HomeCalendarComponent,
    HomeCardMyEventsComponent,
    HomeCardMembersComponent,
    HomeMemberSearchComponent,
    HomeChatComponent,
  ],
  imports: [CommonModule, HomeRoutingModule, SharedModule],
})
export class DashboardModule {}
