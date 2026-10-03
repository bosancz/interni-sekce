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

	private swipeStart?: { x: number; y: number };

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

	@HostListener("document:keyup", ["$event"])
	onKeyUp(event: KeyboardEvent) {
		if (!this.editingCaption() && !this.infoOpen() && !this.faceMenuOpen()) {
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
		if (event.pointerType !== "touch") return;
		this.swipeStart = { x: event.clientX, y: event.clientY };
	}

	onPointerUp(event: PointerEvent) {
		if (!this.swipeStart) return;
		const dx = event.clientX - this.swipeStart.x;
		const dy = event.clientY - this.swipeStart.y;
		this.swipeStart = undefined;

		if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy)) {
			if (dx < 0) this.nextPhoto();
			else this.previousPhoto();
			return;
		}

		if (Math.abs(dy) >= 50) return;

		if (!this.editingCaption()) this.controlsVisible.update((visible) => !visible);
	}

	openPhoto(index: number) {
		const photos = this.photos;
		if (index < 0 || index >= photos.length) return;

		const photo = photos[index];
		this.currentIndex.set(index);
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
