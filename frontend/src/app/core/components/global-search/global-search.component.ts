import { AsyncPipe, DatePipe } from "@angular/common";
import { AfterViewInit, Component, input, output, resource, signal, viewChild } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { Params, Router } from "@angular/router";
import { IonItem, IonLabel, IonList, IonSearchbar, IonSkeletonText } from "@ionic/angular/standalone";
import { debounceTime, Subject } from "rxjs";
import { GlobalSearchService } from "src/app/core/services/global-search.service";
import { ButtonComponent } from "src/app/shared/components/button/button.component";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";

@Component({
	selector: "bo-global-search",
	templateUrl: "./global-search.component.html",
	styleUrl: "./global-search.component.scss",
	imports: [
		IonSearchbar,
		AsyncPipe,
		FormsModule,
		IonList,
		IonItem,
		IonLabel,
		GroupPipe,
		DatePipe,
		IonSkeletonText,
		ButtonComponent,
	],
})
export class GlobalSearchComponent implements AfterViewInit {
	showCancelButton = input(false);

	autofocus = input(false);

	close = output<void>();

	searchBlur = output<void>();

	private readonly searchbar = viewChild(IonSearchbar);

	query = new Subject<string>();
	debouncedQuery = toSignal(this.query.pipe(debounceTime(500)));

	resultsOpen = signal(false);

	private readonly previewLimit = 3;

	membersSearchResults = resource({
		defaultValue: null,
		params: () => (this.debouncedQuery() ? { query: this.debouncedQuery() } : undefined),
		loader: ({ params, abortSignal }) =>
			params.query
				? this.globalSearch.searchMembers(params.query, { limit: this.previewLimit, abortSignal })
				: Promise.resolve(null),
	});

	eventsSearchResults = resource({
		defaultValue: null,
		params: () => (this.debouncedQuery() ? { query: this.debouncedQuery() } : undefined),
		loader: ({ params, abortSignal }) =>
			params.query
				? this.globalSearch.searchEvents(params.query, { limit: this.previewLimit, abortSignal })
				: Promise.resolve(null),
	});

	albumsSearchResults = resource({
		defaultValue: null,
		params: () => (this.debouncedQuery() ? { query: this.debouncedQuery() } : undefined),
		loader: ({ params, abortSignal }) =>
			params.query
				? this.globalSearch.searchAlbums(params.query, { limit: this.previewLimit, abortSignal })
				: Promise.resolve(null),
	});

	constructor(
		private readonly globalSearch: GlobalSearchService,
		private readonly router: Router,
	) {}

	private static readonly AUTOFOCUS_DELAY_MS = 100;

	ngAfterViewInit() {
		if (!this.autofocus()) return;

		setTimeout(() => void this.searchbar()?.setFocus(), GlobalSearchComponent.AUTOFOCUS_DELAY_MS);
	}

	clear() {
		this.query.next("");
		this.resultsOpen.set(false);
	}

	closeSearch() {
		this.clear();
		this.close.emit();
	}

	async navigate(commands: unknown[], queryParams?: Params) {
		this.query.next("");
		this.close.emit();
		await this.router.navigate(commands, queryParams ? { queryParams } : undefined);
	}

	async showAll(commands: unknown[]) {
		await this.navigate(commands, { search: this.debouncedQuery() });
	}
}
