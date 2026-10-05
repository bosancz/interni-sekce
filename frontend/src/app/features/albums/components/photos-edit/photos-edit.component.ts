import { DatePipe, DecimalPipe } from "@angular/common";
import {
	Component,
	computed,
	ElementRef,
	HostListener,
	inject,
	Input,
	OnDestroy,
	OnInit,
	signal,
	ViewChild,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import {
	AlertController,
	IonButton,
	IonButtons,
	IonChip,
	IonContent,
	IonIcon,
	IonInput,
	IonInput as IonInputStandalone,
	IonItem,
	IonLabel,
	IonList,
	IonPopover,
	IonSpinner,
	IonToolbar,
	ModalController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
	checkmarkCircleOutline,
	checkmarkOutline,
	chevronBackOutline,
	chevronForwardOutline,
	closeCircleOutline,
	createOutline,
	happyOutline,
	helpCircleOutline,
	imageOutline,
	personAddOutline,
	personOutline,
	sparklesOutline,
	trashOutline,
	star,
	starOutline,
} from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { UserSettingsService } from "src/app/core/services/user-settings.service";
import { MemberSelectorModalComponent } from "src/app/features/events/components/member-selector-modal/member-selector-modal.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { FACE_EMOTIONS, faceEmotionLabel } from "src/helpers/face-emotions";
import { SDK } from "src/sdk";
import { PhotoTagsEditorComponent } from "../photo-tags-editor/photo-tags-editor.component";

interface Point {
	x: number;
	y: number;
}

interface Zoom {
	scale: number;
	x: number;
	y: number;
}

type ZoomGesture =
	| { type: "single"; start: Point; startZoom: Zoom; pointerType: string; moved: boolean }
	| { type: "pinch"; startDistance: number; startMid: Point; startZoom: Zoom };

const MAX_ZOOM = 6;
const DOUBLE_TAP_ZOOM = 2.5;
const KEYBOARD_ZOOM_STEP = 1.5;
const DOUBLE_TAP_DELAY_MS = 300;
const TAP_TOLERANCE_PX = 10;
const DOUBLE_TAP_DISTANCE_PX = 30;
const SWIPE_DISTANCE_PX = 50;

@Component({
	selector: "bo-photos-edit",
	templateUrl: "./photos-edit.component.html",
	styleUrls: ["./photos-edit.component.scss"],

	imports: [
		FormsModule,
		DatePipe,
		DecimalPipe,
		IonContent,
		IonToolbar,
		IonButtons,
		IonButton,
		IonPopover,
		IonList,
		IonItem,
		IonLabel,
		IonInputStandalone,
		IonIcon,
		IonChip,
		IonSpinner,
		PhotoImageUrlPipe,
		TooltipDirective,
		PhotoTagsEditorComponent,
	],
})
export class PhotosEditComponent implements OnInit, OnDestroy {
	photo = signal<SDK.PhotoResponseWithLinks | undefined>(undefined);
	@Input() photos!: SDK.PhotoResponseWithLinks[];
	@Input() startPhoto?: SDK.PhotoResponseWithLinks;

	albumTags = signal<string[]>([]);

	imageError = signal(false);

	editingCaption = signal(false);

	infoOpen = signal(false);

	currentIndex = signal(0);

	controlsVisible = signal(true);

	isLg = toSignal(this.platformService.isLg, { initialValue: this.platformService.isLg.value });

	zoom = signal<Zoom>({ scale: 1, x: 0, y: 0 });
	zoomed = computed(() => this.zoom().scale > 1.01);
	zoomAnimated = signal(false);
	dragging = signal(false);
	hiResRequested = signal(false);
	hiResLoaded = signal(false);

	private pointers = new Map<number, Point>();
	private gesture?: ZoomGesture;
	private lastTap?: { point: Point; time: number };
	private tapTimeout?: ReturnType<typeof setTimeout>;

	@ViewChild("viewer") private viewer?: ElementRef<HTMLElement>;

	@ViewChild("captionInput") captionInput!: IonInput;

	faces = signal<SDK.PhotoFaceResponseWithLinks[]>([]);
	assignedFaces = computed(() => this.faces().filter((face) => face.member));
	private userSettings = inject(UserSettingsService);
	private photoFacesVisible = this.userSettings.watch("photoFacesVisible");
	facesVisible = computed(() => this.photoFacesVisible() ?? false);
	imageRect = signal<{ left: number; top: number; width: number; height: number } | null>(null);

	faceMenuOpen = signal(false);
	faceMenuEvent = signal<Event | undefined>(undefined);
	selectedFace = signal<SDK.PhotoFaceResponseWithLinks | undefined>(undefined);
	faceSuggestions = signal<SDK.PhotoFaceSuggestionResponse[]>([]);
	faceSuggestionsLoading = signal(false);

	faceEmotions = FACE_EMOTIONS;
	faceEmotionLabel = faceEmotionLabel;

	private imageElement?: HTMLImageElement;
	private resizeObserver = new ResizeObserver(() => this.measureImage());

	constructor(
		private elementRef: ElementRef<HTMLElement>,
		private modalController: ModalController,
		private api: ApiService,
		private toastService: ToastService,
		private alertController: AlertController,
		private router: Router,
		private platformService: PlatformService,
		private modalService: ModalService,
	) {
		addIcons({
			checkmarkCircleOutline,
			helpCircleOutline,
			sparklesOutline,
			closeCircleOutline,
			happyOutline,
			personAddOutline,
			personOutline,
			trashOutline,
			createOutline,
			checkmarkOutline,
			chevronBackOutline,
			chevronForwardOutline,
			imageOutline,
			star,
			starOutline,
		});
	}

	ngOnInit(): void {
		this.rebuildAlbumTags();

		let index = this.photos.findIndex((item) => item.id === this.startPhoto?.id);
		if (index === -1) index = 0;

		this.openPhoto(index);
	}

	ngOnDestroy(): void {
		this.resizeObserver.disconnect();
		clearTimeout(this.tapTimeout);
	}

	@ViewChild("image") set image(ref: ElementRef<HTMLImageElement> | undefined) {
		if (this.imageElement) this.resizeObserver.unobserve(this.imageElement);
		this.imageElement = ref?.nativeElement;
		if (this.imageElement) this.resizeObserver.observe(this.imageElement);
		this.measureImage();
	}

	measureImage() {
		const image = this.imageElement;
		if (!image || !image.complete || !image.naturalWidth) {
			this.imageRect.set(null);
			return;
		}

		this.imageRect.set({
			left: image.offsetLeft,
			top: image.offsetTop,
			width: image.offsetWidth,
			height: image.offsetHeight,
		});
		this.zoom.set(this.clampZoom(this.zoom()));
	}

	toggleFaces() {
		this.userSettings.set("photoFacesVisible", !this.facesVisible());
	}

	private async loadFaces(photo: SDK.PhotoResponseWithLinks) {
		this.faces.set([]);
		if (!photo._links.listPhotoFaces.allowed) return;

		try {
			const faces = await this.api.PhotoGalleryApi.listPhotoFaces(photo.id).then((res) => res.data);
			if (this.photo()?.id === photo.id) this.faces.set(faces);
		} catch {
			this.toastService.toast("Nepodařilo se načíst obličeje.", { color: "warning" });
		}
	}

	openFaceMenu(event: Event, face: SDK.PhotoFaceResponseWithLinks) {
		event.stopPropagation();
		this.selectedFace.set(face);
		this.faceMenuEvent.set(event);
		this.faceMenuOpen.set(true);
		this.loadFaceSuggestions(face);
	}

	private async loadFaceSuggestions(face: SDK.PhotoFaceResponseWithLinks) {
		this.faceSuggestions.set([]);
		if (face.member || !face._links.listPhotoFaceSuggestions.allowed) return;

		this.faceSuggestionsLoading.set(true);
		try {
			const suggestions = await this.api.PhotoGalleryApi.listPhotoFaceSuggestions(face.photoId, face.id).then(
				(res) => res.data,
			);
			if (this.selectedFace()?.id === face.id) this.faceSuggestions.set(suggestions);
		} catch {
			if (this.selectedFace()?.id === face.id) this.faceSuggestions.set([]);
		} finally {
			if (this.selectedFace()?.id === face.id) this.faceSuggestionsLoading.set(false);
		}
	}

	async acceptSuggestion(face: SDK.PhotoFaceResponseWithLinks, suggestion: SDK.PhotoFaceSuggestionResponse) {
		this.faceMenuOpen.set(false);
		await this.updateFace(face, suggestion.member.id);
	}

	async assignFace(face: SDK.PhotoFaceResponseWithLinks) {
		this.faceMenuOpen.set(false);

		const member = await this.modalService.componentModal(
			MemberSelectorModalComponent,
			{ title: "Kdo je na fotce?", subtitle: "Vyber člověka, kterému obličej patří." },
			{ cssClass: "dialog-picker" },
		);
		if (!member) return;

		await this.updateFace(face, member.id);
	}

	matchScoreLabel(face: SDK.PhotoFaceResponseWithLinks) {
		return face.matchScore !== null && face.matchScore !== undefined
			? ` (shoda ${Math.round(face.matchScore * 100)} %)`
			: "";
	}

	async confirmFace(face: SDK.PhotoFaceResponseWithLinks) {
		this.faceMenuOpen.set(false);
		if (face.memberId) await this.updateFace(face, face.memberId);
	}

	async unassignFace(face: SDK.PhotoFaceResponseWithLinks) {
		this.faceMenuOpen.set(false);
		await this.updateFace(face, null);
	}

	private async updateFace(face: SDK.PhotoFaceResponseWithLinks, memberId: number | null) {
		const photo = this.photo();

		try {
			await this.api.PhotoGalleryApi.updatePhotoFace(face.photoId, face.id, { memberId });
		} catch {
			this.toastService.toast("Nepodařilo se uložit, kdo je na fotce.", { color: "warning" });
			return;
		}

		if (photo) await this.loadFaces(photo);
	}

	async deleteFace(face: SDK.PhotoFaceResponseWithLinks) {
		this.faceMenuOpen.set(false);

		const confirmed = await this.modalService.deleteConfirmationModal(
			"Označený výřez se z fotky odebere. Použij, když na něm žádný obličej není.",
			{ header: "Není to obličej?", buttonText: "Odebrat" },
		);
		if (!confirmed) return;

		try {
			await this.api.PhotoGalleryApi.deletePhotoFace(face.photoId, face.id);
		} catch {
			this.toastService.toast("Obličej se nepodařilo odebrat.", { color: "warning" });
			return;
		}

		this.faces.update((faces) => faces.filter((item) => item.id !== face.id));
	}

	async openMember(memberId: number) {
		this.faceMenuOpen.set(false);
		const modal = await this.modalController.getTop();
		if (modal) await this.modalService.dismissAndNavigate(modal, ["/databaze/clenove", memberId]);
		else await this.router.navigate(["/databaze/clenove", memberId]);
	}

	private rebuildAlbumTags() {
		const seen = new Set<string>();
		for (const photo of this.photos) {
			for (const tag of photo.tags ?? []) seen.add(tag);
		}
		this.albumTags.set([...seen]);
	}

	private pressedKeys = new Set<string>();

	@HostListener("document:keydown", ["$event"])
	onKeyDown(event: KeyboardEvent) {
		if (this.isTopOverlay()) this.pressedKeys.add(event.code);
		else this.pressedKeys.delete(event.code);
	}

	private isTopOverlay() {
		const overlays = document.querySelectorAll(
			":is(ion-modal, ion-alert, ion-popover, ion-action-sheet, ion-loading, ion-picker-legacy):not(.overlay-hidden)",
		);
		const top = overlays.item(overlays.length - 1);
		return top ? top === this.elementRef.nativeElement.closest("ion-modal") : true;
	}

	@HostListener("document:keyup", ["$event"])
	onKeyUp(event: KeyboardEvent) {
		if (!this.pressedKeys.delete(event.code)) return;

		if (!this.editingCaption() && !this.infoOpen() && !this.faceMenuOpen()) {
			switch (event.key) {
				case "+":
					return this.zoomAtCenter(this.zoom().scale * KEYBOARD_ZOOM_STEP);
				case "-":
					return this.zoomAtCenter(this.zoom().scale / KEYBOARD_ZOOM_STEP);
				case "0":
					return this.resetZoom(true);
			}
			if (event.code === "Escape" && this.zoomed()) return this.resetZoom(true);

			switch (event.code) {
				case "ArrowLeft":
					return this.previousPhoto();
				case "ArrowRight":
					return this.nextPhoto();
				case "Escape":
					return this.close();
				case "Home":
					return this.openPhoto(0);
				case "End":
					return this.openPhoto(this.photos.length - 1);
				case "Enter":
					return this.editCaption();
			}
		} else {
			switch (event.code) {
				case "Escape":
					return this.cancelEditingCaption();
			}
		}
	}

	nextPhoto() {
		this.openPhoto(this.currentIndex() + 1);
	}

	previousPhoto() {
		this.openPhoto(this.currentIndex() - 1);
	}

	onPointerDown(event: PointerEvent) {
		if (event.pointerType === "mouse" && event.button !== 0) return;
		if ((event.target as Element).closest("ion-button, .title-badge, .face")) return;

		this.viewer?.nativeElement.setPointerCapture(event.pointerId);
		this.pointers.set(event.pointerId, this.viewerPoint(event));
		this.zoomAnimated.set(false);
		this.startGesture(event.pointerType);
	}

	onPointerMove(event: PointerEvent) {
		if (!this.pointers.has(event.pointerId)) return;
		this.pointers.set(event.pointerId, this.viewerPoint(event));

		const gesture = this.gesture;
		if (!gesture) return;

		if (gesture.type === "pinch") {
			const [a, b] = [...this.pointers.values()];
			if (!b) return;
			const { startZoom, startMid } = gesture;
			const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
			const scale = this.clampScale((startZoom.scale * Math.hypot(a.x - b.x, a.y - b.y)) / gesture.startDistance);
			this.setZoom({
				scale,
				x: mid.x - ((startMid.x - startZoom.x) / startZoom.scale) * scale,
				y: mid.y - ((startMid.y - startZoom.y) / startZoom.scale) * scale,
			});
			return;
		}

		const point = this.pointers.get(event.pointerId)!;
		const dx = point.x - gesture.start.x;
		const dy = point.y - gesture.start.y;
		if (Math.hypot(dx, dy) > TAP_TOLERANCE_PX) gesture.moved = true;

		if (gesture.startZoom.scale > 1 && gesture.moved) {
			this.dragging.set(true);
			this.setZoom({ ...gesture.startZoom, x: gesture.startZoom.x + dx, y: gesture.startZoom.y + dy });
		}
	}

	onPointerUp(event: PointerEvent) {
		const point = this.pointers.get(event.pointerId);
		if (!point || !this.pointers.delete(event.pointerId)) return;

		const gesture = this.gesture;
		this.gesture = undefined;
		this.dragging.set(false);

		if (!gesture) return;

		if (gesture.type === "pinch") {
			if (this.pointers.size) this.startGesture(event.pointerType, true);
			else if (this.zoom().scale < 1.05) this.resetZoom(true);
			return;
		}

		if (!gesture.moved) {
			this.onTap(point, gesture.pointerType);
			return;
		}

		if (gesture.startZoom.scale > 1 || gesture.pointerType !== "touch") return;

		const dx = point.x - gesture.start.x;
		const dy = point.y - gesture.start.y;
		if (Math.abs(dx) >= SWIPE_DISTANCE_PX && Math.abs(dx) > Math.abs(dy)) {
			if (dx < 0) this.nextPhoto();
			else this.previousPhoto();
		}
	}

	onPointerCancel(event: PointerEvent) {
		this.pointers.delete(event.pointerId);
		this.gesture = undefined;
		this.dragging.set(false);
	}

	onWheel(event: WheelEvent) {
		event.preventDefault();
		const delta = event.deltaY * (event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1);
		this.zoomAnimated.set(false);
		this.zoomAt(this.viewerPoint(event), this.zoom().scale * Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.002)));
	}

	private startGesture(pointerType: string, moved = false) {
		const points = [...this.pointers.values()];

		if (points.length >= 2) {
			const [a, b] = points;
			clearTimeout(this.tapTimeout);
			this.lastTap = undefined;
			this.gesture = {
				type: "pinch",
				startDistance: Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1),
				startMid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
				startZoom: this.zoom(),
			};
		} else if (points.length === 1) {
			this.gesture = { type: "single", start: points[0], startZoom: this.zoom(), pointerType, moved };
		}
	}

	private onTap(point: Point, pointerType: string) {
		const now = Date.now();
		const last = this.lastTap;

		if (
			last &&
			now - last.time < DOUBLE_TAP_DELAY_MS &&
			Math.hypot(point.x - last.point.x, point.y - last.point.y) < DOUBLE_TAP_DISTANCE_PX
		) {
			clearTimeout(this.tapTimeout);
			this.lastTap = undefined;
			if (this.zoomed()) this.resetZoom(true);
			else this.zoomAt(point, DOUBLE_TAP_ZOOM, true);
			return;
		}

		this.lastTap = { point, time: now };

		if (pointerType !== "touch") return;
		clearTimeout(this.tapTimeout);
		this.tapTimeout = setTimeout(() => {
			if (!this.editingCaption()) this.controlsVisible.update((visible) => !visible);
		}, DOUBLE_TAP_DELAY_MS);
	}

	private viewerPoint(event: MouseEvent): Point {
		const rect = this.viewer?.nativeElement.getBoundingClientRect();
		return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
	}

	private zoomAtCenter(scale: number) {
		const viewer = this.viewer?.nativeElement;
		if (!viewer) return;
		this.zoomAt({ x: viewer.clientWidth / 2, y: viewer.clientHeight / 2 }, scale, true);
	}

	private zoomAt(point: Point, scale: number, animated = false) {
		const current = this.zoom();
		const next = this.clampScale(scale);
		this.zoomAnimated.set(animated);
		this.setZoom({
			scale: next,
			x: point.x - ((point.x - current.x) * next) / current.scale,
			y: point.y - ((point.y - current.y) * next) / current.scale,
		});
	}

	resetZoom(animated = false) {
		this.zoomAnimated.set(animated);
		this.zoom.set({ scale: 1, x: 0, y: 0 });
	}

	private setZoom(zoom: Zoom) {
		if (zoom.scale > 1) this.hiResRequested.set(true);
		this.zoom.set(this.clampZoom(zoom));
	}

	private clampScale(scale: number) {
		return Math.min(MAX_ZOOM, Math.max(1, scale));
	}

	private clampZoom(zoom: Zoom): Zoom {
		const rect = this.imageRect();
		const viewer = this.viewer?.nativeElement;
		if (!rect || !viewer || zoom.scale <= 1) return { scale: 1, x: 0, y: 0 };

		const clampAxis = (offset: number, start: number, size: number, view: number) => {
			const scaled = size * zoom.scale;
			if (scaled <= view) return (view - scaled) / 2 - start * zoom.scale;
			return Math.min(-start * zoom.scale, Math.max(view - (start + size) * zoom.scale, offset));
		};

		return {
			scale: zoom.scale,
			x: clampAxis(zoom.x, rect.left, rect.width, viewer.clientWidth),
			y: clampAxis(zoom.y, rect.top, rect.height, viewer.clientHeight),
		};
	}

	openPhoto(index: number) {
		const photos = this.photos;
		if (index < 0 || index >= photos.length) return;

		const photo = photos[index];
		this.currentIndex.set(index);
		this.resetZoom();
		this.hiResRequested.set(false);
		this.hiResLoaded.set(false);
		this.pointers.clear();
		this.gesture = undefined;
		this.dragging.set(false);
		clearTimeout(this.tapTimeout);
		this.lastTap = undefined;
		this.imageError.set(false);
		this.imageRect.set(null);
		this.photo.set(photo);
		this.loadFaces(photo);

		this.router.navigate([], { queryParams: { photo: photo.id }, queryParamsHandling: "merge", replaceUrl: true });
	}

	editCaption() {
		this.editingCaption.set(true);
		setTimeout(() => this.captionInput?.getInputElement().then((el) => el.focus()));
	}

	cancelEditingCaption() {
		this.editingCaption.set(false);
	}

	async saveCaption(value: string | number | null | undefined) {
		const current = this.photo();
		if (!current) return;

		const caption = value == null || value === "" ? null : String(value);

		try {
			await this.api.PhotoGalleryApi.updatePhoto(current.id, { caption });
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit popisek.", { color: "warning" });
			return;
		}

		const photo = this.photos.find((item) => item.id === current.id) ?? current;
		photo.caption = caption;
		if (this.photo()?.id === photo.id) this.photo.set({ ...photo });
		this.editingCaption.set(false);
	}

	async toggleTitlePhoto() {
		const photo = this.photo();
		if (!photo) return;

		const isTitle = photo.titlePhoto;
		const photoId = isTitle ? null : photo.id;

		try {
			await this.api.PhotoGalleryApi.setAlbumTitlePhoto(photo.albumId, { photoId });
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit titulní fotku.", { color: "warning" });
			return;
		}

		for (const item of this.photos) item.titlePhoto = !isTitle && item.id === photo.id;

		this.photo.set({ ...photo, titlePhoto: !isTitle });

		this.toastService.toast(isTitle ? "Odebráno z titulní fotky." : "Nastaveno jako titulní fotka.");
	}

	async saveTags(tags: string[]) {
		const current = this.photo();
		if (!current) return;

		const photo = this.photos.find((item) => item.id === current.id) ?? current;
		const previous = photo.tags ?? null;
		const next = tags.length ? tags : null;

		const showing = () => this.photo()?.id === photo.id;
		photo.tags = next;
		if (showing()) this.photo.set({ ...photo });
		this.rebuildAlbumTags();

		try {
			await this.api.PhotoGalleryApi.updatePhoto(photo.id, { tags: next });
		} catch (e) {
			this.toastService.toast("Nepodařilo se uložit štítky.", { color: "warning" });
			photo.tags = previous;
			if (showing()) this.photo.set({ ...photo });
			this.rebuildAlbumTags();
		}
	}

	async close() {
		await this.modalController.dismiss();
	}

	async delete(photo: SDK.PhotoResponseWithLinks) {
		const alert = await this.alertController.create({
			header: "Smazat fotku",
			message: "Chcete opravdu smazat tuto fotku?",
			buttons: [
				{ text: "Zrušit", role: "cancel" },
				{ text: "Smazat", role: "submit", handler: () => this.deleteConfirmed(photo) },
			],
		});

		alert.present();
	}

	async deleteConfirmed(photo: SDK.PhotoResponseWithLinks) {
		await this.api.PhotoGalleryApi.deletePhoto(photo.id);

		const photos = this.photos;
		const i = photos.findIndex((item) => item.id === photo.id);
		if (i !== -1) photos.splice(i, 1);

		if (!photos.length) {
			this.modalController.dismiss({ refresh: true });
			return;
		}

		this.openPhoto(Math.min(i, photos.length - 1));
	}

	getMpix(width: number, height: number) {
		return Math.round((width * height) / 1000000);
	}
}
