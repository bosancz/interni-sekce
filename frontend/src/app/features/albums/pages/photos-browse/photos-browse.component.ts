import { Component, computed, signal } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import {
	InfiniteScrollCustomEvent,
	IonButton,
	IonContent,
	IonIcon,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonPopover,
	IonSearchbar,
	IonSpinner,
	IonToolbar,
} from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { chevronDown, closeOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { PhotosEditComponent } from "src/app/features/albums/components/photos-edit/photos-edit.component";
import { MemberSelectorModalComponent } from "src/app/features/events/components/member-selector-modal/member-selector-modal.component";
import { FilterPillComponent, FilterPillOption } from "src/app/shared/components/filter-pill/filter-pill.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageFooterComponent } from "src/app/shared/components/page-footer/page-footer.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { GalleryViewSwitchComponent } from "src/app/features/albums/components/gallery-view-switch/gallery-view-switch.component";
import { PhotoGalleryComponent } from "src/app/shared/components/photo-gallery/photo-gallery.component";
import { FACE_EMOTIONS } from "src/helpers/face-emotions";
import { SDK } from "src/sdk";

const PAGE_SIZE = 60;

interface BrowseFilter {
	q: string;
	dateFrom: string;
	dateTill: string;
	categoryIds: number[];
	memberIds: number[];
	emotions: SDK.FaceEmotionEnum[];
}

@UntilDestroy()
@Component({
	selector: "bo-photos-browse",
	templateUrl: "./photos-browse.component.html",
	styleUrl: "./photos-browse.component.scss",
	imports: [
		PageHeaderComponent,
		PageFooterComponent,
		GalleryViewSwitchComponent,
		PageContentComponent,
		PhotoGalleryComponent,
		FilterPillComponent,
		IonToolbar,
		IonSearchbar,
		IonButton,
		IonIcon,
		IonPopover,
		IonContent,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		IonSpinner,
	],
})
export class PhotosBrowseComponent {
	filter = signal<BrowseFilter>({
		q: "",
		dateFrom: "",
		dateTill: "",
		categoryIds: [],
		memberIds: [],
		emotions: [],
	});
	photos = signal<SDK.PhotoResponseWithLinks[] | undefined>(undefined);
	hasMore = signal(false);

	categories = signal<SDK.PhotoCategoryResponseWithLinks[]>([]);
	years = signal<number[]>([]);
	members = signal<SDK.MemberResponse[]>([]);

	datePopoverOpen = signal(false);
	datePopoverEvent = signal<Event | undefined>(undefined);

	categoryOptions = computed<FilterPillOption[]>(() =>
		this.categories().map((category) => ({ value: String(category.id), label: category.name })),
	);
	selectedCategories = computed(() => this.filter().categoryIds.map(String));

	emotionOptions: FilterPillOption[] = Object.entries(FACE_EMOTIONS).map(([value, emotion]) => ({
		value,
		label: `${emotion.emoji} ${emotion.label}`,
	}));

	membersLabel = computed(() => {
		const ids = this.filter().memberIds;
		if (!ids.length) return "Lidé";
		if (ids.length === 1) {
			const member = this.members().find((item) => item.id === ids[0]);
			if (member) return `Lidé: ${member.nickname || member.firstName}`;
		}
		return `Lidé (${ids.length})`;
	});

	dateLabel = computed(() => {
		const { dateFrom, dateTill } = this.filter();
		const year = this.selectedYear();
		if (year) return `Datum: ${year}`;
		if (dateFrom && dateTill) return `Datum: ${formatDate(dateFrom)} – ${formatDate(dateTill)}`;
		if (dateFrom) return `Datum: od ${formatDate(dateFrom)}`;
		if (dateTill) return `Datum: do ${formatDate(dateTill)}`;
		return "Datum";
	});

	selectedYear = computed(() => {
		const { dateFrom, dateTill } = this.filter();
		const match = dateFrom.match(/^(\d{4})-01-01$/);
		return match && dateTill === `${match[1]}-12-31` ? Number(match[1]) : null;
	});

	hasFilter = computed(() => {
		const filter = this.filter();
		return !!(
			filter.q ||
			filter.dateFrom ||
			filter.dateTill ||
			filter.categoryIds.length ||
			filter.memberIds.length ||
			filter.emotions.length
		);
	});

	description = computed(() => {
		const photos = this.photos();
		if (!photos) return "";
		if (!photos.length)
			return this.hasFilter() ? "Žádné fotky neodpovídají hledání." : "Zatím tu nejsou žádné fotky.";
		return this.filter().q.trim() ? "Seřazeno od nejpodobnějších" : "Seřazeno od nejnovějších";
	});

	private loadToken = 0;

	constructor(
		private api: ApiService,
		private route: ActivatedRoute,
		private router: Router,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ chevronDown, closeOutline });

		this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => this.onParams(params));

		this.loadCategories();
		this.loadYears();
	}

	setSearch(value: string | null | undefined) {
		this.navigate({ q: value ?? "" });
	}

	setCategories(values: string[]) {
		this.navigate({ categoryIds: values.map(Number) });
	}

	setEmotions(values: string[]) {
		this.navigate({ emotions: values as SDK.FaceEmotionEnum[] });
	}

	openDatePopover(event: Event) {
		this.datePopoverEvent.set(event);
		this.datePopoverOpen.set(true);
	}

	setDate(name: "dateFrom" | "dateTill", value: string) {
		this.navigate({ [name]: value });
	}

	setYear(year: number) {
		if (this.selectedYear() === year) this.navigate({ dateFrom: "", dateTill: "" });
		else this.navigate({ dateFrom: `${year}-01-01`, dateTill: `${year}-12-31` });
	}

	clearDate() {
		this.navigate({ dateFrom: "", dateTill: "" });
		this.datePopoverOpen.set(false);
	}

	async selectMembers() {
		const selectedIds = signal(this.filter().memberIds);

		await this.modalService.componentModal(
			MemberSelectorModalComponent,
			{
				title: "Kdo má být na fotkách?",
				subtitle: "Ukážou se fotky, na kterých jsou všichni vybraní.",
				keepOpenAfterSelect: true,
				selectedIds,
				onSelect: (member: SDK.MemberResponse) => {
					this.members.update((members) => [...members.filter((item) => item.id !== member.id), member]);
					selectedIds.update((ids) => [...ids, member.id]);
				},
				onDeselect: (member: SDK.MemberResponse) =>
					selectedIds.update((ids) => ids.filter((id) => id !== member.id)),
				onClearAll: () => selectedIds.set([]),
			},
			{ cssClass: "dialog-picker" },
		);

		const memberIds = selectedIds();
		const current = this.filter().memberIds;
		if (memberIds.length !== current.length || memberIds.some((id, i) => id !== current[i]))
			this.navigate({ memberIds });
	}

	removeMember(memberId: number) {
		this.navigate({ memberIds: this.filter().memberIds.filter((id) => id !== memberId) });
	}

	clearAll() {
		this.navigate({ q: "", dateFrom: "", dateTill: "", categoryIds: [], memberIds: [], emotions: [] });
	}

	selectedMembers = computed(() => {
		const members = new Map(this.members().map((member) => [member.id, member]));
		return this.filter().memberIds.map((id) => ({ id, member: members.get(id) }));
	});

	async openPhoto(photo: SDK.PhotoResponseWithLinks) {
		await this.modalService.modal(
			PhotosEditComponent,
			{ photos: [...(this.photos() ?? [])], startPhoto: photo },
			{ backdropDismiss: false, cssClass: "ion-modal-lg" },
		);
	}

	async loadMore(event: Event) {
		try {
			await this.load("more");
		} finally {
			(event as InfiniteScrollCustomEvent).target.complete();
		}
	}

	private onParams(params: Params) {
		const filter: BrowseFilter = {
			q: params["q"] ?? "",
			dateFrom: params["od"] ?? "",
			dateTill: params["do"] ?? "",
			categoryIds: parseIds(params["kategorie"]),
			memberIds: parseIds(params["lide"]),
			emotions: parseEmotions(params["emoce"]),
		};
		this.filter.set(filter);
		this.loadMembers(filter.memberIds);
		this.load("reset");
	}

	private navigate(patch: Partial<BrowseFilter>) {
		const filter = { ...this.filter(), ...patch };
		this.filter.set(filter);
		this.router.navigate([], {
			queryParams: {
				q: filter.q || null,
				od: filter.dateFrom || null,
				do: filter.dateTill || null,
				kategorie: filter.categoryIds.length ? filter.categoryIds.join(",") : null,
				lide: filter.memberIds.length ? filter.memberIds.join(",") : null,
				emoce: filter.emotions.length ? filter.emotions.join(",") : null,
			},
			replaceUrl: true,
		});
	}

	private async load(mode: "reset" | "more") {
		const filter = this.filter();
		const current = mode === "more" ? (this.photos() ?? []) : [];
		const token = ++this.loadToken;

		if (mode === "reset") this.photos.set(undefined);

		try {
			const page = await this.api.PhotoGalleryApi.browsePhotos({
				q: filter.q.trim() || undefined,
				dateFrom: filter.dateFrom || undefined,
				dateTill: filter.dateTill || undefined,
				categoryIds: filter.categoryIds.length ? filter.categoryIds : undefined,
				memberIds: filter.memberIds.length ? filter.memberIds : undefined,
				emotions: filter.emotions.length ? filter.emotions : undefined,
				limit: PAGE_SIZE,
				offset: current.length,
			}).then((res) => res.data);
			if (token !== this.loadToken) return;

			this.photos.set([...current, ...page]);
			this.hasMore.set(page.length === PAGE_SIZE);
		} catch (err: any) {
			if (token !== this.loadToken) return;
			this.photos.set(current);
			this.hasMore.set(false);
			const message =
				err?.response?.status === 504
					? "Hledání podle obsahu teď nefunguje, zkus to později."
					: "Fotky se nepodařilo načíst.";
			this.toastService.toast(message, { color: "danger" });
		}
	}

	private async loadCategories() {
		try {
			const categories = await this.api.WorkerApi.listPhotoCategories().then((res) => res.data);
			this.categories.set(categories);
		} catch {
			this.categories.set([]);
		}
	}

	private async loadYears() {
		try {
			const years = await this.api.PhotoGalleryApi.getAlbumsYears().then((res) => res.data);
			this.years.set([...years].sort((a, b) => b - a));
		} catch {
			this.years.set([]);
		}
	}

	private async loadMembers(memberIds: number[]) {
		const known = new Set(this.members().map((member) => member.id));
		const missing = memberIds.filter((id) => !known.has(id));
		if (!missing.length) return;

		const members = await Promise.all(
			missing.map((id) =>
				this.api.MembersApi.getMember(id)
					.then((res) => res.data)
					.catch(() => null),
			),
		);
		this.members.update((current) => [
			...current,
			...members.filter((member): member is SDK.MemberResponseWithLinks => !!member),
		]);
	}
}

function parseIds(value: string | undefined): number[] {
	if (!value) return [];
	return value
		.split(",")
		.map((item) => parseInt(item, 10))
		.filter((item) => !isNaN(item));
}

function parseEmotions(value: string | undefined): SDK.FaceEmotionEnum[] {
	if (!value) return [];
	return value.split(",").filter((item): item is SDK.FaceEmotionEnum => item in FACE_EMOTIONS);
}

function formatDate(value: string) {
	const [year, month, day] = value.split("-").map(Number);
	return year && month && day ? `${day}. ${month}. ${year}` : value;
}
