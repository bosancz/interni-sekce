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

	// currently selected tag filter (null = show all photos)
	activeTag = signal<string | null>(null);

	// every distinct tag across the album's photos, in first-seen order — the filter chips
	allTags = computed(() => {
		const seen = new Set<string>();
		for (const photo of this.photos() ?? []) {
			for (const tag of photo.tags ?? []) seen.add(tag);
		}
		return [...seen];
	});

	// ignore a stale selection (e.g. after switching to an album without that tag)
	effectiveTag = computed(() => {
		const tag = this.activeTag();
		return tag && this.allTags().includes(tag) ? tag : null;
	});

	// the photos actually shown: filtered by the active tag, but only while browsing —
	// managing (sort/delete/reorder) always operates on the full set
	displayPhotos = computed(() => {
		const photos = this.photos();
		const tag = this.effectiveTag();
		if (!photos || this.view() !== "gallery" || !tag) return photos;
		return photos.filter((photo) => photo.tags?.includes(tag));
	});

	selectTag(tag: string | null) {
		this.activeTag.set(tag);
	}

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
