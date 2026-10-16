import {
	AfterViewInit,
	Component,
	computed,
	DestroyRef,
	ElementRef,
	Input,
	OnDestroy,
	OnInit,
	signal,
	ViewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { IonIcon, IonPopover, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
	addOutline,
	checkmarkOutline,
	chevronDownOutline,
	closeOutline,
	cloudUploadOutline,
	trashOutline,
} from "ionicons/icons";
import { InputModalComponent } from "src/app/core/services/modal.service";
import {
	getTotalProgress,
	isActivePhotoUpload,
	PhotoUploadItem,
	PhotoUploadService,
	photosWord,
} from "src/app/core/services/photo-upload.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { PrettyBytesPipe } from "src/app/shared/pipes/pretty-bytes.pipe";
import { filter } from "rxjs";
import { PhotoCaptionField, PhotoCaptionFields } from "src/helpers/photo-metadata";
import { SDK } from "src/sdk";

@Component({
	selector: "photos-upload",
	templateUrl: "./photos-upload.component.html",
	styleUrls: ["./photos-upload.component.scss"],

	imports: [IonIcon, IonPopover, ModalLayoutComponent, PrettyBytesPipe],
})
export class PhotosUploadComponent extends InputModalComponent<boolean> implements OnInit, AfterViewInit, OnDestroy {
	@Input() album!: SDK.AlbumResponseWithLinks;

	photoUploadQueue = computed(() =>
		this.photoUploadService.items().filter((item) => item.album.id === this.album.id),
	);

	uploading = computed(() => this.photoUploadQueue().some(isActivePhotoUpload));

	captionField = computed(() => this.photoUploadService.captionFields()[this.album.id] ?? null);

	captionMenuOpen = signal(false);

	captionFieldOptions = computed(() => {
		const queue = this.photoUploadQueue();
		return (Object.keys(PhotoCaptionFields) as PhotoCaptionField[])
			.map((field) => ({
				field,
				...PhotoCaptionFields[field],
				count: queue.filter((item) => item.captions?.[field]).length,
			}))
			.filter((option) => option.count > 0 || option.field === this.captionField());
	});

	selectedCaptionField = computed(() => {
		const field = this.captionField();
		return field ? PhotoCaptionFields[field] : null;
	});

	captionHint = computed(() => {
		const field = this.captionField();
		const queue = this.photoUploadQueue();
		if (!field) return "Fotky se nahrají bez popisku.";

		const count = queue.filter((item) => item.captions?.[field]).length;
		return `S popiskem ${count} / ${queue.length}, ostatní zůstanou bez popisku.`;
	});

	pendingCount = computed(() => this.photoUploadQueue().filter((item) => item.status !== "finished").length);

	finishedCount = computed(() => this.photoUploadQueue().filter((item) => item.status === "finished").length);

	uploadingNumber = computed(() => Math.min(this.finishedCount() + 1, this.photoUploadQueue().length));

	waitingForOtherAlbum = computed(
		() =>
			this.uploading() &&
			!this.photoUploadQueue().some((item) => item.status === "uploading" || item.status === "processing"),
	);

	totalProgress = computed(() => getTotalProgress(this.photoUploadQueue()));

	uploadLabel = computed(() => {
		const count = this.pendingCount();
		if (!count) return "Nahrát fotky";
		return `Nahrát ${count} ${photosWord(count)}`;
	});

	dragOver = signal(false);

	@ViewChild("photoInput") photoInput!: ElementRef<HTMLInputElement>;

	isMobile = signal(false);

	constructor(
		modalController: ModalController,
		private platformService: PlatformService,
		private photoUploadService: PhotoUploadService,
		private destroyRef: DestroyRef,
	) {
		super(modalController);
		addIcons({ addOutline, checkmarkOutline, chevronDownOutline, closeOutline, cloudUploadOutline, trashOutline });
	}

	ngOnInit() {
		this.photoUploadService.open(this.album.id);
		this.photoUploadService.albumFinished
			.pipe(
				filter((albumId) => albumId === this.album.id),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe(() => {
				if (!this.photoUploadQueue().some((item) => item.status === "draft")) this.submit.emit(true);
			});
	}

	ngOnDestroy() {
		this.photoUploadService.closed(this.album.id);
	}

	ngAfterViewInit() {
		if (this.platformService.isMobile.value) {
			this.isMobile.set(true);
			if (!this.photoUploadQueue().length) this.photoInput.nativeElement.click();
		}
	}

	addPhotosByInput(photoInput: HTMLInputElement) {
		if (!photoInput.files?.length) return;
		this.photoUploadService.add(this.album, photoInput.files);
		photoInput.value = "";
	}

	addPhotosByDropzone(event: DragEvent) {
		event.preventDefault();
		this.dragOver.set(false);

		if (!event.dataTransfer?.files?.length || this.uploading()) return;
		this.photoUploadService.add(this.album, event.dataTransfer.files);
	}

	onDragOver(event: DragEvent) {
		event.stopPropagation();
		event.preventDefault();
		if (!this.uploading()) this.dragOver.set(true);
	}

	onDragLeave(event: DragEvent) {
		if (!(event.currentTarget as Element).contains(event.relatedTarget as Node | null)) this.dragOver.set(false);
	}

	removeFromQueue(uploadItem: PhotoUploadItem) {
		this.photoUploadService.remove(uploadItem);
	}

	setCaptionField(field: PhotoCaptionField | null) {
		this.photoUploadService.setCaptionField(this.album.id, field);
		this.captionMenuOpen.set(false);
	}

	getCaption(uploadItem: PhotoUploadItem): string | null {
		return this.photoUploadService.getCaption(uploadItem);
	}

	stopUploading() {
		this.photoUploadService.stop(this.album.id);
	}

	closeModal() {
		if (this.finishedCount() && !this.uploading()) this.submit.emit(true);
		else this.close.emit();
	}

	uploadPhotos() {
		this.photoUploadService.start(this.album.id);
	}
}
