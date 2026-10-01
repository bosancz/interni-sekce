import { Component, computed, HostListener, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
	IonButton,
	IonIcon,
	IonSegment,
	IonSegmentButton,
	IonSkeletonText,
	IonSpinner,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
	checkmarkOutline,
	closeOutline,
	imagesOutline,
	personAddOutline,
	playForwardOutline,
	personOutline,
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
		description: "Automaticky přiřazené i nepřiřazené obličeje v náhodném pořadí.",
	},
	{
		value: "leaders",
		label: "Vedoucí",
		description: "Obličeje přiřazené nebo navržené vedoucím, nejdřív nejistá přiřazení, pak návrhy.",
	},
	{
		value: "member",
		label: "Člen",
		description: "Obličeje přiřazené nebo navržené vybranému členovi, nejdřív nejistá přiřazení, pak návrhy.",
	},
];

@Component({
	selector: "bo-face-review-card",
	templateUrl: "./face-review-card.component.html",
	styleUrl: "./face-review-card.component.scss",
	imports: [
		IonButton,
		IonIcon,
		IonSegment,
		IonSegmentButton,
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
	order = signal<SDK.FaceReviewOrderEnum>("uncertain");
	orderDescription = computed(() => ORDERS.find((order) => order.value === this.order())?.description);

	member = signal<SDK.MemberResponse | undefined>(undefined);
	memberMissing = computed(() => this.order() === "member" && !this.member());

	review = signal<SDK.FaceReviewResponse | undefined>(undefined);
	loading = signal(false);
	saving = signal(false);
	imageLoaded = signal(false);
	reviewed = signal(0);

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
			checkmarkOutline,
			closeOutline,
			imagesOutline,
			personAddOutline,
			personOutline,
			playForwardOutline,
			scanOutline,
			trashOutline,
		});
	}

	ngOnInit() {
		this.load();
	}

	async setOrder(order: SDK.FaceReviewOrderEnum | string | number | undefined) {
		if (!ORDERS.some((item) => item.value === order) || order === this.order()) return;
		this.order.set(order as SDK.FaceReviewOrderEnum);
		this.seenPhotoIds = [];

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
			await this.load();
		} finally {
			this.pickerOpen = false;
		}
	}

	async load(): Promise<void> {
		if (this.memberMissing()) return;

		this.loading.set(true);
		try {
			const review = await this.api.WorkerApi.getFaceForReview({
				order: this.order(),
				memberId: this.order() === "member" ? this.member()?.id : undefined,
				excludePhotoIds: this.seenPhotoIds.length ? this.seenPhotoIds : undefined,
			}).then((res) => res.data);

			if (!review.face && review.remaining && this.seenPhotoIds.length) {
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
				{ title: "Kdo je na fotce?", subtitle: "Vyber člověka, kterému obličej patří." },
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

		await this.save(() => this.api.PhotoGalleryApi.deletePhotoFace(face.photoId, face.id));
	}

	skip() {
		if (this.busy()) return;
		this.next();
	}

	busy() {
		return this.loading() || this.saving();
	}

	private async assign(memberId: number | null) {
		const face = this.face();
		if (!face || this.busy()) return;

		await this.save(() => this.api.PhotoGalleryApi.updatePhotoFace(face.photoId, face.id, { memberId }));
	}

	private async save(request: () => Promise<unknown>) {
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
		await this.next();
	}

	private async next() {
		const photo = this.photo();
		if (photo) this.seenPhotoIds = [...this.seenPhotoIds, photo.id].slice(-SEEN_PHOTOS_LIMIT);
		await this.load();
	}

	@HostListener("document:keydown", ["$event"])
	onKeyDown(event: KeyboardEvent) {
		if (this.pickerOpen || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;

		const target = event.target as HTMLElement | null;
		if (target?.closest("input, textarea, [contenteditable], ion-modal, ion-alert, ion-popover")) return;

		switch (event.key.toLowerCase()) {
			case "a":
				if (this.suggested()) this.confirm();
				break;
			case "n":
				this.reject();
				break;
			case "j":
				this.pickMember();
				break;
			case "s":
				this.skip();
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
