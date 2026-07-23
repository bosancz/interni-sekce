import { AsyncPipe, DatePipe } from "@angular/common";
import { Component, input, output, resource, signal } from "@angular/core";
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
export class GlobalSearchComponent {
	/** Two-way bindable: whether the searchbar is expanded on small screens. */
	showCancelButton = input(false);

	close = output<void>();

	query = new Subject<string>();
	debouncedQuery = toSignal(this.query.pipe(debounceTime(500)));

	resultsOpen = signal(false);

	/** How many results each section previews in the dropdown. */
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

	// Delay closing the dropdown on blur so that click events on result items
	// are processed before the dropdown disappears.
	private static readonly BLUR_CLOSE_DELAY_MS = 200;

	constructor(
		private readonly globalSearch: GlobalSearchService,
		private readonly router: Router,
	) {
		// close/open results based on whether there's a search string, but only after the user stops typing for a bit (debounceTime)
		// this.searchString.pipe(distinctUntilChanged()).subscribe((s) => this.resultsOpen.set(!!s));
	}

	onSearchBlur() {
		setTimeout(() => {
			this.query.next("");
		}, GlobalSearchComponent.BLUR_CLOSE_DELAY_MS);
	}

	closeSearch() {
		this.query.next("");
		this.resultsOpen.set(false);
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
