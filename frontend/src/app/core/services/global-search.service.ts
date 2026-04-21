import { Injectable } from "@angular/core";
import { Observable, from, of } from "rxjs";
import { debounceTime, distinctUntilChanged, switchMap } from "rxjs/operators";
import { SDK } from "src/sdk";
import { ApiService } from "./api.service";

export interface GlobalSearchResults {
	query: string;
	loading: boolean;
	members: SDK.MemberResponse[];
	events: SDK.EventResponse[];
	albums: SDK.AlbumResponse[];
}

const RESULT_LIMIT = 5;
const EMPTY_RESULTS: GlobalSearchResults = {
	query: "",
	loading: false,
	members: [],
	events: [],
	albums: [],
};

@Injectable({
	providedIn: "root",
})
export class GlobalSearchService {
	constructor(private readonly api: ApiService) {}

	/**
	 * Builds an observable stream of search results for the given query stream.
	 * Adds a 500ms debounce and runs all three API requests in parallel.
	 */
	createSearchStream(query$: Observable<string>): Observable<GlobalSearchResults> {
		return query$.pipe(
			debounceTime(500),
			distinctUntilChanged(),
			switchMap((query) => {
				const trimmed = query.trim();
				if (!trimmed) return of(EMPTY_RESULTS);
				return from(this.search(trimmed));
			}),
		);
	}

	async search(query: string): Promise<GlobalSearchResults> {
		const [members, events, albums] = await Promise.all([
			this.api.MembersApi.listMembers({ search: query, limit: RESULT_LIMIT })
				.then((res) => res.data)
				.catch(() => []),
			this.api.EventsApi.listEvents({ search: query, limit: RESULT_LIMIT })
				.then((res) => res.data)
				.catch(() => []),
			this.api.PhotoGalleryApi.listAlbums({ search: query, limit: RESULT_LIMIT })
				.then((res) => res.data)
				.catch(() => []),
		]);

		return { query, loading: false, members, events, albums };
	}
}
