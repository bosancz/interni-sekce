import { HttpClient } from "@angular/common/http";
import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	ElementRef,
	input,
	OnDestroy,
	OnInit,
	signal,
	ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ModalController } from "@ionic/angular";
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
} from "@ionic/angular/standalone";
import { ApiService } from "src/app/services/api.service";
import { PlatformService } from "src/app/services/platform.service";
import { SDK } from "src/sdk";
import { toSignal } from "@angular/core/rxjs-interop";
import { PrettyBytesPipe } from "src/app/shared/pipes/pretty-bytes.pipe";

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
	standalone: true,
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
export class PhotosUploadComponent implements OnInit, AfterViewInit, OnDestroy {
	album = input.required<SDK.AlbumResponseWithLinks>();

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
		private modalController: ModalController,
		private platformService: PlatformService,
		private cdRef: ChangeDetectorRef,
	) {}

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
		const album = this.album();
		// TODO: check photos populater, if it is not populated, get tags from photos
		album.photos!.forEach((photo) => {
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

	close() {
		this.modalController.dismiss(false);
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

		this.modalController.dismiss(true);
	}

	async uploadPhoto(album: SDK.AlbumResponseWithLinks, uploadItem: PhotoUploadItem): Promise<void> {
		if (!this.allowedFiles_re.test(uploadItem.file.name)) {
			throw new Error("Unsupported file type.");
		}

		let formData: FormData = new FormData();

		formData.set("album", String(album.id));
		formData.set("tags", this.selectedTags().join(","));
		formData.set("photo", uploadItem.file, uploadItem.file.name);
		if (uploadItem.file.lastModified)
			formData.set("lastModified", new Date(uploadItem.file.lastModified).toISOString());

		const req = await this.api.PhotoGalleryApi.createPhoto({ file: uploadItem.file, albumId: album.id });

		// TODO: monitor upload using axios
		// return new Promise<void>((resolve, reject) => {
		//   this.http
		//     .post(uploadPath, formData, {
		//       withCredentials: true,
		//       observe: "events",
		//       reportProgress: true,
		//       responseType: "text",
		//     })
		//     .subscribe(
		//       (event: HttpEvent<any>) => {
		//         switch (event.type) {
		//           case HttpEventType.Sent:
		//             break;

		//           case HttpEventType.UploadProgress:
		//             uploadItem.progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
		//             this.cdRef.markForCheck();
		//             if (event.loaded === event.total) uploadItem.status = "processing";
		//             break;

		//           case HttpEventType.Response:
		//             uploadItem.progress = 100;
		//             resolve();
		//             break;
		//         }
		//       },
		//       (err) => reject(err),
		//     );
		// });
	}

	private preventExit() {
		window.addEventListener("beforeunload", this.preventExitListener);
	}

	private allowExit() {
		window.removeEventListener("beforeunload", this.preventExitListener);
	}
}
