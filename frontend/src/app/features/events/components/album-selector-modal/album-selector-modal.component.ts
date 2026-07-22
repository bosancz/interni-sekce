import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
	InfiniteScrollCustomEvent,
	IonButton,
	IonButtons,
	IonContent,
	IonFooter,
	IonIcon,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonItem,
	IonLabel,
	IonList,
	IonNote,
	IonSearchbar,
	IonToolbar,
	ModalController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { addOutline, checkmarkOutline, linkOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { SDK } from "src/sdk";

/** sentinel dismissed by the modal when the user opts to create a new album instead of linking an existing one */
export const CREATE_ALBUM = "create" as const;

@Component({
	selector: "bo-album-selector-modal",
	templateUrl: "./album-selector-modal.component.html",
	styleUrls: ["./album-selector-modal.component.scss"],

	imports: [
		IonToolbar,
		IonSearchbar,
		IonButtons,
		IonButton,
		IonContent,
		IonFooter,
		IonIcon,
		IonList,
		IonItem,
		IonLabel,
		IonNote,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		FormsModule,
		DateRangePipe,
	],
})
export class AlbumSelectorModalComponent
	extends InputModalComponent<SDK.AlbumResponseWithLinks | typeof CREATE_ALBUM>
	implements OnInit
{
	/** when true, shows a hint to verify the album does not exist yet and a button to create a new one */
	allowCreate = false;

	/** pre-fills the search (e.g. with the event name) so likely-matching albums surface immediately */
	initialSearch?: string;

	/** name of the album that "create new" would produce — shown on the create button when set */
	createName?: string;

	albums = signal<SDK.AlbumResponseWithLinks[] | undefined>(undefined);

	/** album highlighted in the list; the "Připojit" button links this one */
	selected = signal<SDK.AlbumResponseWithLinks | undefined>(undefined);

	pageSize = 20;
	page = signal(1);
	searchString = signal<string | undefined>(undefined);

	protected readonly CREATE_ALBUM = CREATE_ALBUM;

	constructor(
		private api: ApiService,
		modalController: ModalController,
	) {
		super(modalController);
		addIcons({ addOutline, checkmarkOutline, linkOutline });
	}

	linkSelected() {
		const album = this.selected();
		if (album) this.submit.emit(album);
	}

	ngOnInit(): void {
		if (this.initialSearch) this.searchString.set(this.initialSearch);
		this.loadAlbums();
	}

	async searchAlbums(searchString?: string) {
		this.searchString.set(searchString || undefined);
		await this.loadAlbums();
	}

	async onInfiniteScroll(e: InfiniteScrollCustomEvent) {
		await this.loadAlbums(true);
		e.target.complete();
	}

	private async loadAlbums(loadMore = false) {
		if (loadMore) {
			const currentAlbums = this.albums();
			if (currentAlbums && currentAlbums.length < this.page() * this.pageSize) return;
			this.page.set(this.page() + 1);
		} else {
			this.page.set(1);
			this.albums.set(undefined);
		}

		const params: SDK.PhotoGalleryApiListAlbumsQueryParams = {
			search: this.searchString(),
			offset: (this.page() - 1) * this.pageSize,
			limit: this.pageSize,
		};

		const newAlbums = await this.api.PhotoGalleryApi.listAlbums(params).then((res) => res.data);

		const currentAlbums = this.albums();
		this.albums.set(currentAlbums ? [...currentAlbums, ...newAlbums] : newAlbums);
	}
}
