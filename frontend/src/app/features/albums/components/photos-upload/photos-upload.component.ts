import { CommonModule } from "@angular/common";
import { HttpClient, HttpEventType } from "@angular/common/http";
import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	OnDestroy,
	OnInit,
	signal,
	ViewChild,
} from "@angular/core";
import {
	IonButton,
	IonButtons,
	IonContent,
	IonFooter,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonToolbar,
	ModalController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { trashOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { PrettyBytesPipe } from "src/app/shared/pipes/pretty-bytes.pipe";
import { Config } from "src/config";
import { SDK } from "src/sdk";

interface PhotoUploadItem {
	file: File;
	progress: number;
	status: string;
	error?: Error;
}

@Component({
	selector: "photos-upload",
	templateUrl: "./photos-upload.component.html",
	styleUrls: ["./photos-upload.component.scss"],

	imports: [
		CommonModule,
		IonContent,
		IonList,
		IonItem,
		IonLabel,
		IonButton,
		IonIcon,
		IonFooter,
		IonToolbar,
		IonButtons,
		PrettyBytesPipe,
	],
})
export class PhotosUploadComponent extends InputModalComponent<boolean> implements OnInit, AfterViewInit, OnDestroy {
	@Input() album!: SDK.AlbumResponseWithLinks;

	tags = signal<string[]>([]);
	selectedTags = signal<string[]>([]);

	uploading = signal(false);

	photoUploadQueue = signal<PhotoUploadItem[]>([]);

	allowedFiles_re = /\.(jpg|jpeg|png|gif)$/i;

	@ViewChild("photoInput") photoInput!: ElementRef<HTMLInputElement>;

	isMobile = signal(false);

	private preventExitListener = (event: BeforeUnloadEvent) => {
		event.preventDefault();
		event.returnValue = "Opravdu chcete zrušit nahrávání fotek?";
		return "Opravdu chcete zrušit nahrávání fotek?";
	};

	constructor(
		private api: ApiService,
		private http: HttpClient,
		modalController: ModalController,
		private platformService: PlatformService,
		private cdRef: ChangeDetectorRef,
		private config: Config,
	) {
		super(modalController);
		addIcons({ trashOutline });
	}

	ngOnInit() {
		this.updateTags();
	}
	ngOnDestroy() {
		this.uploading.set(false);
		this.allowExit();
	}

	ngAfterViewInit() {
		if (this.platformService.isMobile.value) {
			this.isMobile.set(true);
			this.photoInput.nativeElement.click();
		}
	}

	updateTags() {
		const tags: string[] = [];
		const album = this.album;
		album.photos?.forEach((photo) => {
			photo.tags?.filter((tag) => tags.indexOf(tag) === -1).forEach((tag) => tags.push(tag));
		});
		this.tags.set(tags);
	}

	addPhotosByInput(photoInput: HTMLInputElement) {
		if (!photoInput.files?.length) return;

		const queue = [...this.photoUploadQueue()];
		for (let i = 0; i < photoInput.files.length; i++) {
			queue.push({
				file: photoInput.files[i],
				progress: 0,
				status: "pending",
			});
		}
		this.photoUploadQueue.set(queue);
	}

	addPhotosByDropzone(event: DragEvent, dropZone: HTMLDivElement) {
		event.preventDefault();

		if (!event.dataTransfer?.files) return;

		const queue = [...this.photoUploadQueue()];
		for (let i = 0; i < event.dataTransfer.files.length; i++) {
			queue.push({
				file: event.dataTransfer.files[i],
				progress: 0,
				status: "pending",
			});
		}
		this.photoUploadQueue.set(queue);
	}

	onDragOver(event: DragEvent) {
		event.stopPropagation();
		event.preventDefault();
	}

	removeFromQueue(uploadItem: PhotoUploadItem) {
		const queue = this.photoUploadQueue();
		const i = queue.indexOf(uploadItem);
		if (i !== -1) {
			const newQueue = [...queue];
			newQueue.splice(i, 1);
			this.photoUploadQueue.set(newQueue);
		}
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

		this.uploading.set(false);
		this.allowExit();

		this.submit.emit(true);
	}

	async uploadPhoto(album: SDK.AlbumResponseWithLinks, uploadItem: PhotoUploadItem): Promise<void> {
		if (!this.allowedFiles_re.test(uploadItem.file.name)) {
			throw new Error("Unsupported file type.");
		}

		const formData = new FormData();
		formData.set("albumId", String(album.id));
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

	private preventExit() {
		window.addEventListener("beforeunload", this.preventExitListener);
	}

	private allowExit() {
		window.removeEventListener("beforeunload", this.preventExitListener);
	}
}
