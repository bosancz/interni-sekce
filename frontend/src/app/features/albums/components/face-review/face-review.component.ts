import { Component, computed, ElementRef, HostListener, input, linkedSignal, OnInit, signal } from "@angular/core";
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
} from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { MemberSelectorModalComponent } from "src/app/features/events/components/member-selector-modal/member-selector-modal.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { PhotoFaceImageUrlPipe } from "src/app/shared/pipes/photo-face-image-url.pipe";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { FACE_EMOTIONS } from "src/helpers/face-emotions";
import { SDK } from "src/sdk";

const SEEN_PHOTOS_LIMIT = 300;
const HISTORY_LIMIT = 50;

type HistoryEntry = { review: SDK.FaceReviewResponse; decided: boolean };

type FaceOption = {
	member: { id: number; nickname: string };
	score: number | null;
	kind: "auto" | "candidate" | null;
};

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
		value: "unassigned",
		label: "Nepřiřazené",
		description: "Nepřiřazené obličeje postupně po fotkách.",
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
	selector: "bo-face-review",
	templateUrl: "./face-review.component.html",
	styleUrl: "./face-review.component.scss",
	imports: [
		IonButton,
		IonContent,
		IonIcon,
		IonPopover,
		IonSkeletonText,
		IonSpinner,
		RouterLink,
		TooltipDirective,
		PhotoImageUrlPipe,
		PhotoFaceImageUrlPipe,
	],
})
export class FaceReviewComponent implements OnInit {
	albumId = input<number>();
	initialOrder = input<SDK.FaceReviewOrderEnum>("uncertain");
	controls = input(true);

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

	options = computed<FaceOption[]>(() => {
		const face = this.face();
		if (!face) return [];

		const live = this.review()?.options ?? [];
		const liveScore = (memberId: number) => live.find((option) => option.member.id === memberId)?.score;

		const options: FaceOption[] = live.map((option) => ({
			member: option.member,
			score: option.score,
			kind: option.member.id === face.candidateMember?.id && !face.member ? "candidate" : null,
		}));

		if (face.member) {
			const index = options.findIndex((option) => option.member.id === face.member!.id);
			if (index !== -1) options.splice(index, 1);
			options.unshift({
				member: face.member,
				score: liveScore(face.member.id) ?? face.matchScore ?? null,
				kind: face.assignment === "auto" ? "auto" : null,
			});
		} else if (face.candidateMember && !options.some((option) => option.kind === "candidate")) {
			options.unshift({ member: face.candidateMember, score: face.candidateScore ?? null, kind: "candidate" });
		}

		return options.slice(0, Math.max(live.length, 1));
	});

	activeIndex = linkedSignal({ source: this.options, computation: () => 0 });
	active = computed(() => this.options()[this.activeIndex()] ?? null);
	pickActive = computed(() => this.activeIndex() === this.options().length);

	emotion = computed(() => {
		const emotion = this.face()?.emotion;
		return emotion ? FACE_EMOTIONS[emotion] : null;
	});

	private seenPhotoIds: number[] = [];
	private pickerOpen = false;

	constructor(
		private host: ElementRef<HTMLElement>,
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
		});
	}

	ngOnInit() {
		this.order.set(this.initialOrder());
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
			const params = {
				order: this.order(),
				filter: this.filter() ?? undefined,
				memberId: this.filter() === "member" ? this.member()?.id : undefined,
				excludePhotoIds: this.seenPhotoIds.length ? this.seenPhotoIds : undefined,
				faceId,
			};
			const albumId = this.albumId();
			const review = await (
				albumId !== undefined
					? this.api.PhotoGalleryApi.getAlbumFaceForReview(albumId, params)
					: this.api.WorkerApi.getFaceForReview(params)
			).then((res) => res.data);

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

	async confirm(option = this.active()) {
		if (this.pickActive() && option === this.active()) return this.pickMember();
		if (option) await this.assign(option.member.id);
	}

	moveActive(step: number) {
		const count = this.options().length + 1;
		this.activeIndex.update((index) => (index + step + count) % count);
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

	skip() {
		if (this.busy()) return;
		this.remember(false);
		this.next(true);
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

	private async next(skipped = false) {
		const photo = this.photo();
		if (photo && (skipped || this.order() !== "unassigned"))
			this.seenPhotoIds = [...this.seenPhotoIds, photo.id].slice(-SEEN_PHOTOS_LIMIT);
		await this.load();
	}

	@HostListener("document:keydown", ["$event"])
	onKeyDown(event: KeyboardEvent) {
		if (this.pickerOpen || this.scopeOpen() || event.altKey || event.shiftKey || event.repeat) return;

		const target = event.target as HTMLElement | null;
		if (target?.closest("input, textarea, [contenteditable], ion-alert, ion-popover")) return;
		const modal = target?.closest("ion-modal");
		if (modal && !modal.contains(this.host.nativeElement)) return;

		const key = event.key.toLowerCase();
		if (event.ctrlKey || event.metaKey) {
			if (key !== "z") return;
			this.undo();
			event.preventDefault();
			return;
		}

		switch (key) {
			case "enter":
				this.confirm();
				break;
			case "arrowright":
				this.skip();
				break;
			case "arrowleft":
				this.undo();
				break;
			case "arrowdown":
				this.moveActive(1);
				break;
			case "arrowup":
				this.moveActive(-1);
				break;
			case "n":
				this.reject();
				break;
			case "v":
				this.pickMember();
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
