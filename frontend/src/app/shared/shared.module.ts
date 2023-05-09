import { CommonModule, DatePipe } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { SwiperModule } from "swiper/angular";
import { ActionButtonsComponent } from "./components/action-buttons/action-buttons.component";
import { AdminTableComponent } from "./components/admin-table/admin-table.component";
import { DotComponent } from "./components/dot/dot.component";
import { EventCalendarComponent } from "./components/event-calendar/event-calendar.component";
import { EventCardComponent } from "./components/event-card/event-card.component";
import { EventStatusBadgeComponent } from "./components/event-status-badge/event-status-badge.component";
import { GroupsSelectComponent } from "./components/groups-select/groups-select.component";
import { MemberItemDetailComponent } from "./components/member-item-detail/member-item-detail.component";
import { PageContentComponent } from "./components/page-content/page-content.component";
import { PageTitleComponent } from "./components/page-title/page-title.component";
import { PhotoFaceComponent } from "./components/photo-face/photo-face.component";
import { PhotoGalleryComponent } from "./components/photo-gallery/photo-gallery.component";
import { AgePipe } from "./pipes/age.pipe";
import { DateRangePipe } from "./pipes/date-range.pipe";
import { EventStatusPipe } from "./pipes/event-status.pipe";
import { EventPipe } from "./pipes/event.pipe";
import { FormatPhonePipe } from "./pipes/format-phone.pipe";
import { GroupPipe } from "./pipes/group.pipe";
import { JoinLeadersPipe } from "./pipes/join-leaders.pipe";
import { MemberPipe } from "./pipes/member.pipe";
import { PrettyBytesPipe } from "./pipes/pretty-bytes.pipe";

@NgModule({
  imports: [CommonModule, FormsModule, RouterModule, IonicModule, SwiperModule],
  declarations: [
    ActionButtonsComponent,
    AdminTableComponent,
    AgePipe,
    DateRangePipe,
    DotComponent,
    EventCalendarComponent,
    EventCardComponent,
    EventPipe,
    EventStatusBadgeComponent,
    EventStatusPipe,
    FormatPhonePipe,
    GroupPipe,
    GroupsSelectComponent,
    JoinLeadersPipe,
    MemberItemDetailComponent,
    MemberPipe,
    PageContentComponent,
    PageTitleComponent,
    PhotoFaceComponent,
    PhotoGalleryComponent,
    PrettyBytesPipe,
  ],
  exports: [
    FormsModule,
    IonicModule,
    SwiperModule,

    ActionButtonsComponent,
    AdminTableComponent,
    AgePipe,
    DateRangePipe,
    DotComponent,
    EventCalendarComponent,
    EventCardComponent,
    EventPipe,
    EventStatusBadgeComponent,
    EventStatusPipe,
    FormatPhonePipe,
    GroupPipe,
    GroupsSelectComponent,
    JoinLeadersPipe,
    MemberItemDetailComponent,
    MemberPipe,
    PageContentComponent,
    PageTitleComponent,
    PhotoFaceComponent,
    PhotoGalleryComponent,
    PrettyBytesPipe,
  ],
  providers: [DatePipe],
})
export class SharedModule {}
