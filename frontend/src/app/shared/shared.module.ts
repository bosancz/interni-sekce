import { CommonModule, DatePipe } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { ActionButtonsComponent } from "./components/action-buttons/action-buttons.component";
import { AdminTableComponent } from "./components/admin-table/admin-table.component";
import { CardContentComponent } from "./components/card-content/card-content.component";
import { CardFooterComponent } from "./components/card-footer/card-footer.component";
import { CardTitleComponent } from "./components/card-title/card-title.component";
import { CardComponent } from "./components/card/card.component";
import { DotComponent } from "./components/dot/dot.component";
import { EditButtonComponent } from "./components/edit-button/edit-button.component";
import { EventCalendarComponent } from "./components/event-calendar/event-calendar.component";
import { EventCardComponent } from "./components/event-card/event-card.component";
import { EventStatusBadgeComponent } from "./components/event-status-badge/event-status-badge.component";
import { FilterComponent } from "./components/filter/filter.component";
import { GroupsSelectComponent } from "./components/groups-select/groups-select.component";
import { MemberItemDetailComponent } from "./components/member-item-detail/member-item-detail.component";
import { MemberSelectComponent } from "./components/member-select/member-select.component";
import { PageContentComponent } from "./components/page-content/page-content.component";
import { PageFooterComponent } from "./components/page-footer/page-footer.component";
import { PageHeaderComponent } from "./components/page-header/page-header.component";
import { PaginationComponent } from "./components/pagination/pagination.component";
import { PhotoFaceComponent } from "./components/photo-face/photo-face.component";
import { PhotoGalleryComponent } from "./components/photo-gallery/photo-gallery.component";
import { AlbumPipe } from "./pipes/album.pipe";
import { DateRangePipe } from "./pipes/date-range.pipe";
import { EventStatusPipe } from "./pipes/event-status.pipe";
import { EventPipe } from "./pipes/event.pipe";
import { FormatPhonePipe } from "./pipes/format-phone.pipe";
import { GroupPipe } from "./pipes/group.pipe";
import { JoinLeadersPipe } from "./pipes/join-leaders.pipe";
import { MarkdownPipe } from "./pipes/markdown.pipe";
import { MemberPipe } from "./pipes/member.pipe";
import { PrettyBytesPipe } from "./pipes/pretty-bytes.pipe";

import { NgChartsModule } from "ng2-charts";
import { register } from "swiper/element/bundle";
import { AddButtonComponent } from "./components/add-button/add-button.component";
import { CardHeaderComponent } from "./components/card-header/card-header.component";
import { CardOpenButtonComponent } from "./components/card-open-button/card-open-button.component";
import { CopyButtonComponent } from "./components/copy-button/copy-button.component";
import { DeleteButtonComponent } from "./components/delete-button/delete-button.component";
import { FilterModalComponent } from "./components/filter-modal/filter-modal.component";
import { GroupBadgeComponent } from "./components/group-badge/group-badge.component";
import { ItemComponent } from "./components/item/item.component";
import { ModalTemplateComponent } from "./components/modal-template/modal-template.component";
import { ModalComponent } from "./components/modal/modal.component";
import { TabComponent } from "./components/tab/tab.component";
import { TabsComponent } from "./components/tabs/tabs.component";
import { EventExpensePipe } from "./pipes/event-expense.pipe";
import { RolePipe } from "./pipes/role.pipe";
// register Swiper custom elements
register();

@NgModule({
  imports: [CommonModule, FormsModule, RouterModule, IonicModule, NgChartsModule],
  declarations: [
    ActionButtonsComponent,
    AdminTableComponent,
    AlbumPipe,
    CardComponent,
    CardContentComponent,
    CardTitleComponent,
    DateRangePipe,
    DotComponent,
    EventCalendarComponent,
    EventCardComponent,
    EventPipe,
    EventStatusBadgeComponent,
    EventStatusPipe,
    FilterComponent,
    FormatPhonePipe,
    GroupPipe,
    GroupsSelectComponent,
    JoinLeadersPipe,
    MemberItemDetailComponent,
    MemberPipe,
    PageContentComponent,
    PageFooterComponent,
    PageHeaderComponent,
    PaginationComponent,
    PhotoFaceComponent,
    PhotoGalleryComponent,
    PrettyBytesPipe,
    CardFooterComponent,
    MarkdownPipe,
    MemberSelectComponent,
    EditButtonComponent,
    CopyButtonComponent,
    AddButtonComponent,
    GroupBadgeComponent,
    CardOpenButtonComponent,
    CardHeaderComponent,
    TabsComponent,
    TabComponent,
    ItemComponent,
    ModalComponent,
    EventExpensePipe,
    DeleteButtonComponent,
    RolePipe,
    FilterModalComponent,
    ModalTemplateComponent,
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule,
    NgChartsModule,

    ActionButtonsComponent,
    AdminTableComponent,
    AlbumPipe,
    CardComponent,
    CardContentComponent,
    CardFooterComponent,
    CardTitleComponent,
    DateRangePipe,
    DotComponent,
    EventCalendarComponent,
    EventCardComponent,
    EventPipe,
    EventStatusBadgeComponent,
    EventStatusPipe,
    FilterComponent,
    FormatPhonePipe,
    GroupPipe,
    GroupsSelectComponent,
    JoinLeadersPipe,
    MemberItemDetailComponent,
    MemberPipe,
    PageContentComponent,
    PageFooterComponent,
    PageHeaderComponent,
    PaginationComponent,
    PhotoFaceComponent,
    PhotoGalleryComponent,
    PrettyBytesPipe,
    MarkdownPipe,
    EditButtonComponent,
    CopyButtonComponent,
    AddButtonComponent,
    GroupBadgeComponent,
    CardOpenButtonComponent,
    CardHeaderComponent,
    TabsComponent,
    TabComponent,
    ItemComponent,
    ModalComponent,
    EventExpensePipe,
    DeleteButtonComponent,
    RolePipe,
    ModalTemplateComponent,
  ],
  providers: [DatePipe],
})
export class SharedModule {}
