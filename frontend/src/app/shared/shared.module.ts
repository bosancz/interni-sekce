import { CommonModule, DatePipe } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from "ng2-charts";
import { register } from "swiper/element/bundle";
import { ActionButtonsComponent } from "./components/action-buttons/action-buttons.component";
import { AddButtonComponent } from "./components/add-button/add-button.component";
import { AdminTableComponent } from "./components/admin-table/admin-table.component";
import { AvatarComponent } from "./components/avatar/avatar.component";
import { CardContentComponent } from "./components/card-content/card-content.component";
import { CardFooterComponent } from "./components/card-footer/card-footer.component";
import { CardHeaderComponent } from "./components/card-header/card-header.component";
import { CardOpenButtonComponent } from "./components/card-open-button/card-open-button.component";
import { CardTitleComponent } from "./components/card-title/card-title.component";
import { CardComponent } from "./components/card/card.component";
import { CopyButtonComponent } from "./components/copy-button/copy-button.component";
import { DeleteButtonComponent } from "./components/delete-button/delete-button.component";
import { DotComponent } from "./components/dot/dot.component";
import { EditButtonDateRangeComponent } from "./components/edit-button-date-range/edit-button-date-range.component";
import { EditButtonDateComponent } from "./components/edit-button-date/edit-button-date.component";
import { EditButtonMarkdownComponent } from "./components/edit-button-markdown/edit-button-markdown.component";
import { EditButtonNameComponent } from "./components/edit-button-name/edit-button-name.component";
import { EditButtonSelectComponent } from "./components/edit-button-select/edit-button-select.component";
import { EditButtonTextComponent } from "./components/edit-button-text/edit-button-text.component";
import { EditButtonComponent } from "./components/edit-button/edit-button.component";
import { EventCalendarComponent } from "./components/event-calendar/event-calendar.component";
import { EventCardComponent } from "./components/event-card/event-card.component";
import { EventStatusBadgeComponent } from "./components/event-status-badge/event-status-badge.component";
import { FilterModalComponent } from "./components/filter-modal/filter-modal.component";
import { FilterComponent } from "./components/filter/filter.component";
import { GroupBadgeComponent } from "./components/group-badge/group-badge.component";
import { GroupsSelectComponent } from "./components/groups-select/groups-select.component";
import { IconButtonComponent } from "./components/icon-button/icon-button.component";
import { ItemComponent } from "./components/item/item.component";
import { MemberItemDetailComponent } from "./components/member-item-detail/member-item-detail.component";
import { MemberSelectComponent } from "./components/member-select/member-select.component";
import { ModalLayoutComponent } from "./components/modal-layout/modal-layout.component";
import { ModalTemplateComponent } from "./components/modal-template/modal-template.component";
import { PageContentComponent } from "./components/page-content/page-content.component";
import { PageFooterComponent } from "./components/page-footer/page-footer.component";
import { PageHeaderActionsComponent } from "./components/page-header-actions/page-header-actions.component";
import { PageHeaderComponent } from "./components/page-header/page-header.component";
import { PaginationComponent } from "./components/pagination/pagination.component";
import { PhotoFaceComponent } from "./components/photo-face/photo-face.component";
import { PhotoGalleryComponent } from "./components/photo-gallery/photo-gallery.component";
import { TabComponent } from "./components/tab/tab.component";
import { TabsComponent } from "./components/tabs/tabs.component";
import { AlbumPipe } from "./pipes/album.pipe";
import { DateRangePipe } from "./pipes/date-range.pipe";
import { EventExpensePipe } from "./pipes/event-expense.pipe";
import { EventStatusPipe } from "./pipes/event-status.pipe";
import { EventPipe } from "./pipes/event.pipe";
import { FormatPhonePipe } from "./pipes/format-phone.pipe";
import { GroupPipe } from "./pipes/group.pipe";
import { JoinLeadersPipe } from "./pipes/join-leaders.pipe";
import { MarkdownPipe } from "./pipes/markdown.pipe";
import { MemberPipe } from "./pipes/member.pipe";
import { PrettyBytesPipe } from "./pipes/pretty-bytes.pipe";
import { RolePipe } from "./pipes/role.pipe";
// register Swiper custom elements
register();

@NgModule({
	imports: [CommonModule, FormsModule, RouterModule, IonicModule, BaseChartDirective],
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
		ModalLayoutComponent,
		EventExpensePipe,
		DeleteButtonComponent,
		RolePipe,
		FilterModalComponent,
		ModalTemplateComponent,
		IconButtonComponent,
		EditButtonTextComponent,
		EditButtonDateRangeComponent,
		EditButtonMarkdownComponent,
		EditButtonNameComponent,
		EditButtonDateComponent,
		EditButtonSelectComponent,
		PageHeaderActionsComponent,
		AvatarComponent,
	],
	exports: [
		FormsModule,
		ReactiveFormsModule,
		IonicModule,
		RouterModule,
		BaseChartDirective,

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
		ModalLayoutComponent,
		EventExpensePipe,
		DeleteButtonComponent,
		RolePipe,
		ModalTemplateComponent,
		IconButtonComponent,
		EditButtonTextComponent,
		EditButtonDateRangeComponent,
		EditButtonMarkdownComponent,
		EditButtonNameComponent,
		EditButtonDateComponent,
		EditButtonSelectComponent,
		PageHeaderActionsComponent,
		AvatarComponent,
	],
	providers: [DatePipe, provideCharts(withDefaultRegisterables())],
})
export class SharedModule {}
