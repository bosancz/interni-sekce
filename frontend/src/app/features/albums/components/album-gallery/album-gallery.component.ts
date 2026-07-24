import { Component, input, output } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
	closeOutline,
	cloudUploadOutline,
	createOutline,
	eyeOutline,
	imageOutline,
	swapVerticalOutline,
	trashOutline,
} from "ionicons/icons";
import { PhotoGalleryComponent } from "src/app/shared/components/photo-gallery/photo-gallery.component";
import { SDK } from "src/sdk";
import { PhotoListComponent } from "../photo-list/photo-list.component";

@Component({
	selector: "bo-album-gallery",
	templateUrl: "./album-gallery.component.html",
	styleUrls: ["./album-gallery.component.scss"],

	imports: [IonButton, IonIcon, PhotoGalleryComponent, PhotoListComponent],
})
export class AlbumGalleryComponent {
	photos = input<SDK.PhotoResponseWithLinks[] | undefined>(undefined);
	view = input<"gallery" | "manage">("gallery");
	selecting = input<boolean>(false);
	selectedPhotos = input<SDK.PhotoResponseWithLinks[]>([]);

	upload = output<void>();
	viewChange = output<"gallery" | "manage">();
	sort = output<void>();
	selectingStart = output<void>();
	selectingCancel = output<void>();
	deleteSelected = output<void>();
	selectedPhotosChange = output<SDK.PhotoResponseWithLinks[]>();
	reorder = output<SDK.PhotoResponseWithLinks[]>();
	photoClick = output<SDK.PhotoResponseWithLinks>();
	listClick = output<CustomEvent<SDK.PhotoResponseWithLinks | undefined>>();
	longPress = output<SDK.PhotoResponseWithLinks>();

	constructor() {
		addIcons({
			cloudUploadOutline,
			trashOutline,
			swapVerticalOutline,
			closeOutline,
			createOutline,
			eyeOutline,
			imageOutline,
		});
	}
}
