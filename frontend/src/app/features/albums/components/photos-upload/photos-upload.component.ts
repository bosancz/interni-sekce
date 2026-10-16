import { HttpClient, HttpEventType } from "@angular/common/http";
import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	computed,
	ElementRef,
	Input,
	OnDestroy,
	signal,
	ViewChild,
} from "@angular/core";
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
import { PlatformService } from "src/app/core/services/platform.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { PrettyBytesPipe } from "src/app/shared/pipes/pretty-bytes.pipe";
import { Config } from "src/config";
import {
	PhotoCaptionField,
	PhotoCaptionFields,
	PhotoCaptionValues,
	readPhotoCaptionValues,
} from "src/helpers/photo-metadata";
import { SDK } from "src/sdk";

type PhotoUploadStatus = "pending" | "uploading" | "processing" | "finished" | "error";

interface PhotoUploadItem {
	file: File;
	thumbnailUrl: string;
	progress: number;
	status: PhotoUploadStatus;
	error?: Error;
	captions?: PhotoCaptionValues;
}

const DEFAULT_CAPTION_FIELD: PhotoCaptionField = "xmpDescription";

@Component({
	selector: "photos-upload",
	templateUrl: "./photos-upload.component.html",
	styleUrls: ["./photos-upload.component.scss"],

	imports: [IonIcon, IonPopover, ModalLayoutComponent, PrettyBytesPipe],
})
export class PhotosUploadComponent extends InputModalComponent<boolean> implements AfterViewInit, OnDestroy {
	@Input() album!: SDK.AlbumResponseWithLinks;

	uploading = signal(false);

	photoUploadQueue = signal<PhotoUploadItem[]>([]);

	captionField = signal<PhotoCaptionField | null>(null);
	private captionFieldChosen = false;

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

	totalProgress = computed(() => {
		const queue = this.photoUploadQueue();
		if (!queue.length) return 0;
		return Math.round(
			queue.reduce((sum, item) => sum + (item.status === "finished" ? 100 : item.progress), 0) / queue.length,
		);
	});

	uploadLabel = computed(() => {
		const count = this.pendingCount();
		if (!count) return "Nahrát fotky";
		return `Nahrát ${count} ${this.photosWord(count, "fotku", "fotky", "fotek")}`;
	});

	dragOver = signal(false);

	allowedFiles_re = /\.(jpg|jpeg|png|gif)$/i;

	@ViewChild("photoInput") photoInput!: ElementRef<HTMLInputElement>;

	isMobile = signal(false);

	private preventExitListener = (event: BeforeUnloadEvent) => {
		event.preventDefault();
		event.returnValue = "Opravdu chcete zrušit nahrávání fotek?";
		return "Opravdu chcete zrušit nahrávání fotek?";
	};

	constructor(
		private http: HttpClient,
		modalController: ModalController,
		private platformService: PlatformService,
		private cdRef: ChangeDetectorRef,
		private config: Config,
	) {
		super(modalController);
		addIcons({ addOutline, checkmarkOutline, chevronDownOutline, closeOutline, cloudUploadOutline, trashOutline });
	}

	ngOnDestroy() {
		this.uploading.set(false);
		this.allowExit();
		for (const item of this.photoUploadQueue()) URL.revokeObjectURL(item.thumbnailUrl);
	}

	ngAfterViewInit() {
		if (this.platformService.isMobile.value) {
			this.isMobile.set(true);
			this.photoInput.nativeElement.click();
		}
	}

	addPhotosByInput(photoInput: HTMLInputElement) {
		if (!photoInput.files?.length) return;
		this.addFiles(photoInput.files);
		photoInput.value = "";
	}

	addPhotosByDropzone(event: DragEvent) {
		event.preventDefault();
		this.dragOver.set(false);

		if (!event.dataTransfer?.files?.length || this.uploading()) return;
		this.addFiles(event.dataTransfer.files);
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
		URL.revokeObjectURL(uploadItem.thumbnailUrl);
		this.photoUploadQueue.set(this.photoUploadQueue().filter((item) => item !== uploadItem));
	}

	setCaptionField(field: PhotoCaptionField | null) {
		this.captionFieldChosen = true;
		this.captionField.set(field);
		this.captionMenuOpen.set(false);
	}

	getCaption(uploadItem: PhotoUploadItem): string | null {
		const field = this.captionField();
		return field ? (uploadItem.captions?.[field] ?? null) : null;
	}

	stopUploading() {
		this.uploading.set(false);
	}

	closeModal() {
		if (this.finishedCount()) this.submit.emit(true);
		else this.close.emit();
	}

	async uploadPhotos(album: SDK.AlbumResponseWithLinks) {
		this.uploading.set(true);
		this.preventExit();

		const queue = [...this.photoUploadQueue()];
		for (let i = 0; i < queue.length; i++) {
			if (!this.uploading()) break;

			const uploadItem = queue[i];
			if (uploadItem.status === "finished") continue;

			try {
				uploadItem.status = "uploading";
				uploadItem.error = undefined;
				this.photoUploadQueue.set([...queue]);
				await this.uploadPhoto(album, uploadItem);
				uploadItem.status = "finished";
				this.photoUploadQueue.set([...queue]);
			} catch (err: any) {
				uploadItem.status = "error";
				uploadItem.error = err;
				this.photoUploadQueue.set([...queue]);
			}
		}

		const stopped = !this.uploading();
		this.uploading.set(false);
		this.allowExit();

		if (!stopped) this.submit.emit(true);
	}

	async uploadPhoto(album: SDK.AlbumResponseWithLinks, uploadItem: PhotoUploadItem): Promise<void> {
		if (!this.allowedFiles_re.test(uploadItem.file.name)) {
			throw new Error("Nepodporovaný typ souboru.");
		}

		const formData = new FormData();
		formData.set("albumId", String(album.id));
		const caption = this.getCaption(uploadItem);
		if (caption) formData.set("caption", caption);
		formData.set("file", uploadItem.file, uploadItem.file.name);

		const request = this.http.post(`${this.config.apiRoot}api/photos`, formData, {
			withCredentials: true,
			observe: "events",
			reportProgress: true,
		});

		await new Promise<void>((resolve, reject) => {
			request.subscribe({
				next: (event) => {
					if (event.type === HttpEventType.UploadProgress) {
						uploadItem.progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
						if (event.total && event.loaded === event.total) uploadItem.status = "processing";
						this.photoUploadQueue.set([...this.photoUploadQueue()]);
						this.cdRef.markForCheck();
					} else if (event.type === HttpEventType.Response) {
						uploadItem.progress = 100;
						resolve();
					}
				},
				error: (err) => reject(err),
			});
		});
	}

	private addFiles(files: FileList) {
		const items: PhotoUploadItem[] = Array.from(files).map((file) => ({
			file,
			thumbnailUrl: URL.createObjectURL(file),
			progress: 0,
			status: "pending",
		}));
		this.photoUploadQueue.set([...this.photoUploadQueue(), ...items]);

		for (const item of items) this.readCaptions(item);
	}

	private async readCaptions(uploadItem: PhotoUploadItem) {
		try {
			uploadItem.captions = await readPhotoCaptionValues(uploadItem.file);
		} catch (err) {
			console.warn(`Failed to read metadata of ${uploadItem.file.name}`, err);
			uploadItem.captions = {};
		}

		if (!this.captionFieldChosen && uploadItem.captions[DEFAULT_CAPTION_FIELD]) {
			this.captionField.set(DEFAULT_CAPTION_FIELD);
		}

		this.photoUploadQueue.set([...this.photoUploadQueue()]);
	}

	private photosWord(count: number, one: string, few: string, many: string) {
		if (count === 1) return one;
		if (count >= 2 && count <= 4) return few;
		return many;
	}

	private preventExit() {
		window.addEventListener("beforeunload", this.preventExitListener);
	}

	private allowExit() {
		window.removeEventListener("beforeunload", this.preventExitListener);
	}
}
