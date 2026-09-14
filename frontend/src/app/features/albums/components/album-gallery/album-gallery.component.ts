import { Component, computed, input, output, signal } from "@angular/core";
import { IonButton, IonChip, IonIcon } from "@ionic/angular/standalone";
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

	imports: [IonButton, IonChip, IonIcon, PhotoGalleryComponent, PhotoListComponent],
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

	activeTag = signal<string | null>(null);

	allTags = computed(() => {
		const seen = new Set<string>();
		for (const photo of this.photos() ?? []) {
			for (const tag of photo.tags ?? []) seen.add(tag);
		}
		return [...seen];
	});

	effectiveTag = computed(() => {
		const tag = this.activeTag();
		return tag && this.allTags().includes(tag) ? tag : null;
	});

	displayPhotos = computed(() => {
		const photos = this.photos();
		const tag = this.effectiveTag();
		if (!photos || this.view() !== "gallery" || !tag) return photos;
		return photos.filter((photo) => photo.tags?.includes(tag));
	});

	selectTag(tag: string | null) {
		this.activeTag.set(tag);
	}

	toggleTag(tag: string) {
		this.activeTag.set(this.effectiveTag() === tag ? null : tag);
	}

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
