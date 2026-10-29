import { Component, ElementRef, linkedSignal, OnDestroy, OnInit, signal, ViewChild } from "@angular/core";
import { IonIcon, ModalController, ViewDidEnter } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkOutline, closeOutline, imagesOutline, searchOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-album-selector-modal",
	templateUrl: "./album-selector-modal.component.html",
	styleUrl: "./album-selector-modal.component.scss",
	imports: [IonIcon, ModalLayoutComponent, DateRangePipe, PhotoImageUrlPipe],
})
export class AlbumSelectorModalComponent
	extends InputModalComponent<SDK.AlbumResponseWithLinks>
	implements OnInit, OnDestroy, ViewDidEnter
{
	initialSearch?: string;

	eventId?: number;

	albums = signal<SDK.AlbumResponseWithLinks[] | undefined>(undefined);

	selected = signal<SDK.AlbumResponseWithLinks | undefined>(undefined);

	activeIndex = linkedSignal<SDK.AlbumResponseWithLinks[] | undefined, number>({
		source: this.albums,
		computation: (albums, previous) => (previous && albums?.length ? previous.value : -1),
	});

	loadingMore = signal(false);

	pageSize = 20;
	searchDebounceMs = 300;
	page = 1;
	hasMore = true;
	searchString = signal("");

	@ViewChild("searchInput") searchInput?: ElementRef<HTMLInputElement>;
	@ViewChild("list") list?: ElementRef<HTMLElement>;
	@ViewChild("sentinel") set sentinel(sentinel: ElementRef<HTMLElement> | undefined) {
		this.observer?.disconnect();
		if (!sentinel) return;
		this.observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) this.loadAlbums(true);
		});
		this.observer.observe(sentinel.nativeElement);
	}

	private observer?: IntersectionObserver;
	private searchTimeout?: number;
	private requestId = 0;

	constructor(
		private api: ApiService,
		modalController: ModalController,
	) {
		super(modalController);
		addIcons({ checkmarkOutline, closeOutline, imagesOutline, searchOutline });
	}

	ngOnInit(): void {
		if (this.initialSearch) this.searchString.set(this.initialSearch);
		this.loadAlbums();
	}

	ngOnDestroy(): void {
		this.observer?.disconnect();
		window.clearTimeout(this.searchTimeout);
	}

	ionViewDidEnter(): void {
		this.searchInput?.nativeElement.select();
	}

	link(album?: SDK.AlbumResponseWithLinks) {
		if (album) this.submit.emit(album);
	}

	onSearchInput(value: string) {
		this.searchString.set(value);
		window.clearTimeout(this.searchTimeout);
		this.searchTimeout = window.setTimeout(() => this.loadAlbums(), this.searchDebounceMs);
	}

	onSearchKeydown(event: KeyboardEvent) {
		const albums = this.albums() ?? [];
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				if (albums.length) this.setActive(Math.min(this.activeIndex() + 1, albums.length - 1));
				break;
			case "ArrowUp":
				event.preventDefault();
				if (albums.length) this.setActive(Math.max(this.activeIndex() - 1, 0));
				break;
			case "Enter": {
				event.preventDefault();
				const album = albums[this.activeIndex()];
				if (album) {
					if (this.selected()?.id === album.id) this.link(album);
					else this.selected.set(album);
				}
				break;
			}
		}
	}

	setActive(index: number) {
		this.activeIndex.set(index);
		window.requestAnimationFrame(() =>
			this.list?.nativeElement.querySelectorAll(".as-row")[index]?.scrollIntoView({ block: "nearest" }),
		);
	}

	private async loadAlbums(loadMore = false) {
		if (loadMore && (!this.hasMore || this.loadingMore() || this.albums() === undefined)) return;

		const requestId = ++this.requestId;
		if (loadMore) {
			this.loadingMore.set(true);
			this.page++;
		} else {
			this.page = 1;
			this.hasMore = true;
			this.albums.set(undefined);
		}

		try {
			const newAlbums = await this.api.PhotoGalleryApi.listAlbums({
				search: this.searchString().trim() || undefined,
				offset: (this.page - 1) * this.pageSize,
				limit: this.pageSize,
			}).then((res) => res.data);

			if (requestId !== this.requestId) return;

			this.hasMore = newAlbums.length === this.pageSize;
			this.albums.set(loadMore ? [...(this.albums() ?? []), ...newAlbums] : newAlbums);
		} finally {
			if (requestId === this.requestId) this.loadingMore.set(false);
		}
	}
}
