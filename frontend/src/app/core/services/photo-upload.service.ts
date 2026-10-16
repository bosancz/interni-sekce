import { HttpClient, HttpEventType } from "@angular/common/http";
import { computed, Injectable, signal } from "@angular/core";
import { Subject } from "rxjs";
import { ToastService } from "src/app/core/services/toast.service";
import { Config } from "src/config";
import { PhotoCaptionField, PhotoCaptionValues, readPhotoCaptionValues } from "src/helpers/photo-metadata";
import { SDK } from "src/sdk";

export type PhotoUploadStatus = "draft" | "queued" | "uploading" | "processing" | "finished" | "error";

export interface PhotoUploadItem {
	album: SDK.AlbumResponseWithLinks;
	file: File;
	thumbnailUrl: string;
	progress: number;
	status: PhotoUploadStatus;
	error?: Error;
	captions?: PhotoCaptionValues;
	caption?: string | null;
}

const DEFAULT_CAPTION_FIELD: PhotoCaptionField = "xmpDescription";

const ACTIVE_STATUSES: PhotoUploadStatus[] = ["queued", "uploading", "processing"];

export function isActivePhotoUpload(item: PhotoUploadItem) {
	return ACTIVE_STATUSES.includes(item.status);
}

export function photosWord(count: number) {
	if (count === 1) return "fotku";
	if (count >= 2 && count <= 4) return "fotky";
	return "fotek";
}

@Injectable({ providedIn: "root" })
export class PhotoUploadService {
	readonly allowedFiles_re = /\.(jpg|jpeg|png|gif)$/i;

	readonly items = signal<PhotoUploadItem[]>([]);

	readonly openAlbumId = signal<number | null>(null);

	readonly albumFinished = new Subject<number>();

	readonly captionFields = signal<Record<number, PhotoCaptionField | null>>({});
	private readonly captionFieldsChosen = new Set<number>();

	readonly batch = computed(() => this.items().filter((item) => item.status !== "draft"));

	readonly uploading = computed(() => this.items().some(isActivePhotoUpload));

	readonly finishedCount = computed(() => this.batch().filter((item) => item.status === "finished").length);

	readonly errorCount = computed(() => this.batch().filter((item) => item.status === "error").length);

	readonly totalProgress = computed(() => getTotalProgress(this.batch()));

	readonly currentAlbum = computed(() => {
		const batch = this.batch();
		return (batch.find(isActivePhotoUpload) ?? batch.find((item) => item.status === "error"))?.album ?? null;
	});

	private running = false;

	private preventExitListener = (event: BeforeUnloadEvent) => {
		event.preventDefault();
		event.returnValue = "Opravdu chcete zrušit nahrávání fotek?";
		return "Opravdu chcete zrušit nahrávání fotek?";
	};

	constructor(
		private http: HttpClient,
		private config: Config,
		private toastService: ToastService,
	) {}

	albumItems(albumId: number) {
		return this.items().filter((item) => item.album.id === albumId);
	}

	albumUploading(albumId: number) {
		return this.albumItems(albumId).some(isActivePhotoUpload);
	}

	add(album: SDK.AlbumResponseWithLinks, files: FileList | File[]) {
		const items: PhotoUploadItem[] = Array.from(files).map((file) => ({
			album,
			file,
			thumbnailUrl: URL.createObjectURL(file),
			progress: 0,
			status: "draft",
		}));
		this.items.set([...this.items(), ...items]);

		for (const item of items) this.readCaptions(item);
	}

	remove(uploadItem: PhotoUploadItem) {
		if (isActivePhotoUpload(uploadItem)) return;
		URL.revokeObjectURL(uploadItem.thumbnailUrl);
		this.items.set(this.items().filter((item) => item !== uploadItem));
	}

	captionField(albumId: number) {
		return this.captionFields()[albumId] ?? null;
	}

	setCaptionField(albumId: number, field: PhotoCaptionField | null) {
		this.captionFieldsChosen.add(albumId);
		this.captionFields.set({ ...this.captionFields(), [albumId]: field });
	}

	getCaption(uploadItem: PhotoUploadItem): string | null {
		if (uploadItem.status !== "draft" && uploadItem.status !== "error") return uploadItem.caption ?? null;
		const field = this.captionField(uploadItem.album.id);
		return field ? (uploadItem.captions?.[field] ?? null) : null;
	}

	start(albumId: number) {
		for (const item of this.albumItems(albumId)) {
			if (item.status !== "draft" && item.status !== "error") continue;
			item.caption = this.getCaption(item);
			item.status = "queued";
			item.progress = 0;
			item.error = undefined;
		}
		this.refresh();
		this.run();
	}

	stop(albumId: number) {
		for (const item of this.albumItems(albumId)) {
			if (item.status === "queued") item.status = "draft";
		}
		this.refresh();
	}

	open(albumId: number) {
		this.openAlbumId.set(albumId);
	}

	closed(albumId: number) {
		if (this.openAlbumId() === albumId) this.openAlbumId.set(null);

		const keepAll = this.albumUploading(albumId);
		const dropped = this.albumItems(albumId).filter((item) => (keepAll ? item.status === "draft" : true));
		if (!dropped.length) return;

		for (const item of dropped) URL.revokeObjectURL(item.thumbnailUrl);
		this.items.set(this.items().filter((item) => !dropped.includes(item)));
		if (!keepAll) {
			this.captionFieldsChosen.delete(albumId);
			const { [albumId]: _, ...captionFields } = this.captionFields();
			this.captionFields.set(captionFields);
		}
	}

	private async run() {
		if (this.running) return;
		this.running = true;
		this.preventExit();

		try {
			let uploadItem: PhotoUploadItem | undefined;
			while ((uploadItem = this.items().find((item) => item.status === "queued"))) {
				const albumId = uploadItem.album.id;
				try {
					uploadItem.status = "uploading";
					this.refresh();
					await this.uploadPhoto(uploadItem);
					uploadItem.status = "finished";
				} catch (err: any) {
					uploadItem.status = "error";
					uploadItem.error = err;
				}
				this.refresh();

				if (!this.albumUploading(albumId)) this.finishAlbum(albumId);
			}
		} finally {
			this.running = false;
			this.allowExit();
		}
	}

	private finishAlbum(albumId: number) {
		const items = this.albumItems(albumId);
		const finished = items.filter((item) => item.status === "finished");

		this.albumFinished.next(albumId);

		if (this.openAlbumId() === albumId || !items.length) return;

		const errors = items.filter((item) => item.status === "error").length;
		const albumName = items[0].album.name;
		const message = errors
			? `Do alba ${albumName} se nenahrálo ${errors} z ${finished.length + errors} fotek.`
			: `Nahráno ${finished.length} ${photosWord(finished.length)} do alba ${albumName}.`;
		this.toastService.toast(message, { duration: errors ? 5000 : 3000, color: errors ? "danger" : undefined });

		for (const item of finished) URL.revokeObjectURL(item.thumbnailUrl);
		this.items.set(this.items().filter((item) => !finished.includes(item)));
	}

	private async uploadPhoto(uploadItem: PhotoUploadItem): Promise<void> {
		if (!this.allowedFiles_re.test(uploadItem.file.name)) {
			throw new Error("Nepodporovaný typ souboru.");
		}

		const formData = new FormData();
		formData.set("albumId", String(uploadItem.album.id));
		if (uploadItem.caption) formData.set("caption", uploadItem.caption);
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
						this.refresh();
					} else if (event.type === HttpEventType.Response) {
						uploadItem.progress = 100;
						resolve();
					}
				},
				error: (err) => reject(err),
			});
		});
	}

	private async readCaptions(uploadItem: PhotoUploadItem) {
		try {
			uploadItem.captions = await readPhotoCaptionValues(uploadItem.file);
		} catch (err) {
			console.warn(`Failed to read metadata of ${uploadItem.file.name}`, err);
			uploadItem.captions = {};
		}

		const albumId = uploadItem.album.id;
		if (!this.captionFieldsChosen.has(albumId) && uploadItem.captions[DEFAULT_CAPTION_FIELD]) {
			this.captionFields.set({ ...this.captionFields(), [albumId]: DEFAULT_CAPTION_FIELD });
		}

		this.refresh();
	}

	private refresh() {
		this.items.set([...this.items()]);
	}

	private preventExit() {
		window.addEventListener("beforeunload", this.preventExitListener);
	}

	private allowExit() {
		window.removeEventListener("beforeunload", this.preventExitListener);
	}
}

export function getTotalProgress(items: PhotoUploadItem[]) {
	if (!items.length) return 0;
	return Math.round(
		items.reduce((sum, item) => sum + (item.status === "finished" ? 100 : item.progress), 0) / items.length,
	);
}
