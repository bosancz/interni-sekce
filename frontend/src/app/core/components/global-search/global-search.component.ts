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
	/** Two-way bindable: whether the searchbar is expanded on small screens. */
	showCancelButton = input(false);

	/** Focus the searchbar as soon as the component shows up. */
	autofocus = input(false);

	/** The user dismissed the search (cancel button) or picked a result. */
	close = output<void>();

	/** The searchbar lost focus — consumers that float the results decide whether to hide them. */
	searchBlur = output<void>();

	private readonly searchbar = viewChild(IonSearchbar);

	query = new Subject<string>();
	debouncedQuery = toSignal(this.query.pipe(debounceTime(500)));

	resultsOpen = signal(false);

	/** How many results each section previews before "Zobrazit vše". */
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
	) {
		// close/open results based on whether there's a search string, but only after the user stops typing for a bit (debounceTime)
		// this.searchString.pipe(distinctUntilChanged()).subscribe((s) => this.resultsOpen.set(!!s));
	}

	// the searchbar only takes focus once its web component has rendered, which is a tick after
	// the view is initialised
	private static readonly AUTOFOCUS_DELAY_MS = 100;

	ngAfterViewInit() {
		if (!this.autofocus()) return;

		setTimeout(() => void this.searchbar()?.setFocus(), GlobalSearchComponent.AUTOFOCUS_DELAY_MS);
	}

	/** Empty the searchbar, which also drops the results. */
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

	/** Open a full list page with the current query prefilled into its own search filter. */
	async showAll(commands: unknown[]) {
		await this.navigate(commands, { search: this.debouncedQuery() });
	}
}
