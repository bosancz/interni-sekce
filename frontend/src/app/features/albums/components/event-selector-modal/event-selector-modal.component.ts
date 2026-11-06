import { AfterViewInit, Component, ElementRef, OnInit, signal, viewChild } from "@angular/core";
import { IonIcon, IonSpinner, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { closeOutline, searchOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-event-selector-modal",
	templateUrl: "./event-selector-modal.component.html",
	styleUrls: ["./event-selector-modal.component.scss"],
	imports: [IonIcon, IonSpinner, ModalLayoutComponent, DateRangePipe],
})
export class EventSelectorModalComponent
	extends InputModalComponent<SDK.EventResponseWithLinks>
	implements OnInit, AfterViewInit
{
	events = signal<SDK.EventResponseWithLinks[] | undefined>(undefined);
	loading = signal(false);
	hasMore = signal(false);
	searchString = signal<string | undefined>(undefined);

	pageSize = 20;

	private searchInput = viewChild<ElementRef<HTMLInputElement>>("searchInput");
	private searchTimeout?: ReturnType<typeof setTimeout>;
	private requestId = 0;

	constructor(
		private api: ApiService,
		modalController: ModalController,
	) {
		super(modalController);
		addIcons({ closeOutline, searchOutline });
	}

	ngOnInit(): void {
		this.loadEvents();
	}

	ngAfterViewInit(): void {
		setTimeout(() => this.searchInput()?.nativeElement.focus(), 300);
	}

	onSearchInput(value: string) {
		this.searchString.set(value.trim() || undefined);
		clearTimeout(this.searchTimeout);
		this.searchTimeout = setTimeout(() => this.loadEvents(), 300);
	}

	async loadEvents(loadMore = false) {
		const currentEvents = loadMore ? (this.events() ?? []) : [];
		if (!loadMore) this.events.set(undefined);

		const requestId = ++this.requestId;
		this.loading.set(true);

		const params: SDK.EventsApiListEventsQueryParams = {
			search: this.searchString(),
			offset: currentEvents.length,
			limit: this.pageSize,
		};

		try {
			const newEvents = await this.api.EventsApi.listEvents(params).then((res) => res.data);
			if (requestId !== this.requestId) return;
			this.events.set([...currentEvents, ...newEvents]);
			this.hasMore.set(newEvents.length === this.pageSize);
		} finally {
			if (requestId === this.requestId) this.loading.set(false);
		}
	}
}
