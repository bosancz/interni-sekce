import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SharedModule } from "src/app/shared/shared.module";
import { AlbumsRoutingModule } from "./albums-routing.module";
/* COMPONENTS */
import { EventSelectorModalComponent } from "./components/event-selector-modal/event-selector-modal.component";
import { EventSelectorComponent } from "./components/event-selector/event-selector.component";
import { PhotoListComponent } from "./components/photo-list/photo-list.component";
import { PhotosEditComponent } from "./components/photos-edit/photos-edit.component";
import { PhotosUploadComponent } from "./components/photos-upload/photos-upload.component";
/* VIEWS */
import { AlbumsTabsComponent } from "./components/albums-tabs/albums-tabs.component";
import { AlbumsEditComponent } from "./pages/albums-edit/albums-edit.component";
import { AlbumsListComponent } from "./pages/albums-list/albums-list.component";
import { AlbumsViewInfoComponent } from "./pages/albums-view-info/albums-view-info.component";
import { AlbumsViewPhotosComponent } from "./pages/albums-view-photos/albums-view-photos.component";

@NgModule({
	declarations: [
		AlbumsListComponent,
		AlbumsEditComponent,
		PhotosUploadComponent,
		AlbumsViewInfoComponent,
		AlbumsViewPhotosComponent,
		PhotosEditComponent,
		EventSelectorComponent,
		EventSelectorModalComponent,
		PhotoListComponent,
		AlbumsTabsComponent,
	],
	imports: [CommonModule, AlbumsRoutingModule, SharedModule],
	providers: [],
})
export class AlbumsModule {}
