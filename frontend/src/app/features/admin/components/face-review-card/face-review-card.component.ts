import { Component, computed, HostListener, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonButton, IonContent, IonIcon, IonPopover, IonSkeletonText, IonSpinner } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
	arrowUndoOutline,
	checkmarkOutline,
	chevronDownOutline,
	closeOutline,
	imagesOutline,
	peopleOutline,
	personAddOutline,
	playForwardOutline,
	scanOutline,
	trashOutline,
} from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { MemberSelectorModalComponent } from "src/app/features/events/components/member-selector-modal/member-selector-modal.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { PhotoFaceImageUrlPipe } from "src/app/shared/pipes/photo-face-image-url.pipe";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { FACE_EMOTIONS } from "src/helpers/face-emotions";
import { SDK } from "src/sdk";

const SEEN_PHOTOS_LIMIT = 300;
const HISTORY_LIMIT = 50;

type HistoryEntry = { review: SDK.FaceReviewResponse; decided: boolean };

const ORDERS: { value: SDK.FaceReviewOrderEnum; label: string; description: string }[] = [
	{
		value: "uncertain",
		label: "Nejisté",
		description: "Automatická přiřazení od nejnižší shody.",
	},
	{
		value: "candidates",
		label: "Návrhy",
		description: "Nepřiřazené obličeje s návrhem pod hranicí, od nejvyšší shody.",
	},
	{
		value: "random",
		label: "Náhodně",
		description: "Automaticky přiřazené i navržené obličeje v náhodném pořadí.",
	},
];

const FILTERS: { value: SDK.FaceReviewFilterEnum | null; label: string; chip: string; description: string }[] = [
	{ value: null, label: "Všichni", chip: "Všichni", description: "" },
	{ value: "leaders", label: "Jen vedoucí", chip: "Jen vedoucí", description: "Jen vedoucí." },
	{ value: "children", label: "Jen děti", chip: "Jen děti", description: "Jen děti." },
	{ value: "member", label: "Vybrat člena…", chip: "Vybraný člen…", description: "Jen vybraný člen." },
];

@Component({
	selector: "bo-face-review-card",
	templateUrl: "./face-review-card.component.html",
	styleUrl: "./face-review-card.component.scss",
	imports: [
		IonButton,
		IonContent,
		IonIcon,
		IonPopover,
		IonSkeletonText,
		IonSpinner,
		RouterLink,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		TooltipDirective,
		PhotoImageUrlPipe,
		PhotoFaceImageUrlPipe,
	],
})
export class FaceReviewCardComponent implements OnInit {
	orders = ORDERS;
	filters = FILTERS;
	order = signal<SDK.FaceReviewOrderEnum>("uncertain");
	filter = signal<SDK.FaceReviewFilterEnum | null>(null);
	member = signal<SDK.MemberResponse | undefined>(undefined);

	scopeOpen = signal(false);
	scopeEvent = signal<Event | undefined>(undefined);
	scopeLabel = computed(() => {
		const filter = this.filter();
		if (filter === "member" && this.member()) return this.member()!.nickname;
		return FILTERS.find((item) => item.value === filter)?.label ?? "";
	});

	description = computed(() => {
		const filter = this.filter();
		const member = this.member();
		return [
			ORDERS.find((order) => order.value === this.order())?.description,
			filter === "member" && member
				? `Jen ${member.nickname}.`
				: FILTERS.find((item) => item.value === filter)?.description,
		]
			.filter(Boolean)
			.join(" ");
	});
	memberMissing = computed(() => this.filter() === "member" && !this.member());

	review = signal<SDK.FaceReviewResponse | undefined>(undefined);
	loading = signal(false);
	saving = signal(false);
	imageLoaded = signal(false);
	reviewed = signal(0);
	history = signal<HistoryEntry[]>([]);

	face = computed(() => this.review()?.face ?? null);
	photo = computed(() => this.review()?.photo ?? null);

	suggested = computed(() => {
		const face = this.face();
		if (!face) return null;
		if (face.member) return { member: face.member, score: face.matchScore ?? face.candidateScore ?? null };
		if (face.candidateMember) return { member: face.candidateMember, score: face.candidateScore ?? null };
		return null;
	});

	emotion = computed(() => {
		const emotion = this.face()?.emotion;
		return emotion ? FACE_EMOTIONS[emotion] : null;
	});

	private seenPhotoIds: number[] = [];
	private pickerOpen = false;

	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({
			arrowUndoOutline,
			checkmarkOutline,
			chevronDownOutline,
			closeOutline,
			imagesOutline,
			peopleOutline,
			personAddOutline,
			playForwardOutline,
			scanOutline,
			trashOutline,
		});
	}

	ngOnInit() {
		this.load();
	}

	async setOrder(order: SDK.FaceReviewOrderEnum) {
		if (order === this.order()) return;
		this.order.set(order);
		this.seenPhotoIds = [];
		this.history.set([]);
		await this.load();
	}

	openScope(event: Event) {
		this.scopeEvent.set(event);
		this.scopeOpen.set(true);
	}

	async pickScope(filter: SDK.FaceReviewFilterEnum | null) {
		this.scopeOpen.set(false);
		if (filter === "member" && this.filter() === "member") {
			await this.selectMember();
			return;
		}
		await this.setFilter(filter);
	}

	async setFilter(filter: SDK.FaceReviewFilterEnum | null) {
		if (!FILTERS.some((item) => item.value === filter) || filter === this.filter()) return;
		this.filter.set(filter);
		this.seenPhotoIds = [];
		this.history.set([]);

		if (this.memberMissing()) {
			this.review.set(undefined);
			await this.selectMember();
			return;
		}

		await this.load();
	}

	async selectMember() {
		this.pickerOpen = true;
		try {
			const member = await this.modalService.componentModal(
				MemberSelectorModalComponent,
				{
					title: "Čí obličeje kontrolovat?",
					subtitle: "Ukážou se obličeje přiřazené nebo navržené tomuto členovi.",
				},
				{ cssClass: "dialog-picker" },
			);
			if (!member) return;

			this.member.set(member);
			this.seenPhotoIds = [];
			this.history.set([]);
			await this.load();
		} finally {
			this.pickerOpen = false;
		}
	}

	async load(faceId?: number): Promise<void> {
		if (this.memberMissing()) return;

		this.loading.set(true);
		try {
			const review = await this.api.WorkerApi.getFaceForReview({
				order: this.order(),
				filter: this.filter() ?? undefined,
				memberId: this.filter() === "member" ? this.member()?.id : undefined,
				excludePhotoIds: this.seenPhotoIds.length ? this.seenPhotoIds : undefined,
				faceId,
			}).then((res) => res.data);

			if (faceId === undefined && !review.face && review.remaining && this.seenPhotoIds.length) {
				this.seenPhotoIds = [];
				return await this.load();
			}

			if (review.photo?.id !== this.photo()?.id) this.imageLoaded.set(false);
			this.review.set(review);
		} catch {
			this.toastService.toast("Nepodařilo se načíst další obličej.", { color: "warning" });
		} finally {
			this.loading.set(false);
		}
	}

	async confirm() {
		const suggested = this.suggested();
		if (suggested) await this.assign(suggested.member.id);
	}

	async pickMember() {
		const face = this.face();
		if (!face || this.busy()) return;

		this.pickerOpen = true;
		try {
			const member = await this.modalService.componentModal(
				MemberSelectorModalComponent,
				{ title: "Kdo je na fotce?", subtitle: "Vyber člověka, kterému obličej patří.", allowCreate: true },
				{ cssClass: "dialog-picker" },
			);
			if (member) await this.assign(member.id);
		} finally {
			this.pickerOpen = false;
		}
	}

	async reject() {
		await this.assign(null);
	}

	async deleteFace() {
		const face = this.face();
		if (!face || this.busy()) return;

		this.pickerOpen = true;
		const confirmed = await this.modalService
			.deleteConfirmationModal("Označený výřez se z fotky odebere. Použij, když na něm žádný obličej není.", {
				header: "Není to obličej?",
				buttonText: "Odebrat",
			})
			.finally(() => (this.pickerOpen = false));
		if (!confirmed) return;

		await this.save(() => this.api.PhotoGalleryApi.deletePhotoFace(face.photoId, face.id), false);
	}

	skip() {
		if (this.busy()) return;
		this.remember(false);
		this.next();
	}

	async undo() {
		const entry = this.history().at(-1);
		const face = entry?.review.face;
		if (!entry || !face || this.busy()) return;

		if (entry.decided) {
			this.saving.set(true);
			try {
				await this.api.PhotoGalleryApi.resetPhotoFaceAssignment(face.photoId, face.id);
			} catch {
				this.toastService.toast("Nepodařilo se vrátit poslední rozhodnutí.", { color: "warning" });
				return;
			} finally {
				this.saving.set(false);
			}
			this.reviewed.update((count) => Math.max(0, count - 1));
		}

		this.history.update((history) => history.slice(0, -1));
		this.seenPhotoIds = this.seenPhotoIds.filter((id) => id !== face.photoId);
		await this.load(face.id);
	}

	busy() {
		return this.loading() || this.saving();
	}

	private async assign(memberId: number | null) {
		const face = this.face();
		if (!face || this.busy()) return;

		await this.save(() => this.api.PhotoGalleryApi.updatePhotoFace(face.photoId, face.id, { memberId }));
	}

	private async save(request: () => Promise<unknown>, undoable = true) {
		this.saving.set(true);
		try {
			await request();
		} catch {
			this.toastService.toast("Nepodařilo se uložit, kdo je na fotce.", { color: "warning" });
			return;
		} finally {
			this.saving.set(false);
		}

		this.reviewed.update((count) => count + 1);
		if (undoable) this.remember(true);
		await this.next();
	}

	private remember(decided: boolean) {
		const review = this.review();
		if (!review?.face) return;
		this.history.update((history) => [...history, { review, decided }].slice(-HISTORY_LIMIT));
	}

	private async next() {
		const photo = this.photo();
		if (photo) this.seenPhotoIds = [...this.seenPhotoIds, photo.id].slice(-SEEN_PHOTOS_LIMIT);
		await this.load();
	}

	@HostListener("document:keydown", ["$event"])
	onKeyDown(event: KeyboardEvent) {
		if (this.pickerOpen || this.scopeOpen() || event.altKey || event.repeat) return;

		const target = event.target as HTMLElement | null;
		if (target?.closest("input, textarea, [contenteditable], ion-modal, ion-alert, ion-popover")) return;

		const key = event.key.toLowerCase();
		if (event.ctrlKey || event.metaKey) {
			if (key !== "z" || event.shiftKey) return;
			this.undo();
			event.preventDefault();
			return;
		}

		switch (key) {
			case "a":
				if (this.suggested()) this.confirm();
				break;
			case "n":
				this.reject();
				break;
			case "v":
				this.pickMember();
				break;
			case "s":
				this.skip();
				break;
			case "z":
				this.undo();
				break;
			default:
				return;
		}
		event.preventDefault();
	}

	score(value: number | null | undefined) {
		return value == null ? "" : `${Math.round(value * 100)} %`;
	}
}
