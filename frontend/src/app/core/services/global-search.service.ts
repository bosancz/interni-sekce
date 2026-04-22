import { Injectable } from "@angular/core";
import { SDK } from "src/sdk";
import { ApiService } from "./api.service";

export interface GlobalSearchResults {
	query: string;
	loading: boolean;
	members: SDK.MemberResponse[];
	events: SDK.EventResponse[];
	albums: SDK.AlbumResponse[];
}

export interface SearchOptions {
	limit?: number;
	abortSignal?: AbortSignal;
}

@Injectable({
	providedIn: "root",
})
export class GlobalSearchService {
	constructor(private readonly api: ApiService) {}

	async searchMembers(query: string, options: SearchOptions = {}) {
		return this.api.MembersApi.listMembers({ search: query, limit: options.limit }).then((res) => res.data);
	}

	async searchEvents(query: string, options: SearchOptions = {}) {
		return this.api.EventsApi.listEvents({ search: query, limit: options.limit }).then((res) => res.data);
	}

	async searchAlbums(query: string, options: SearchOptions = {}) {
		return this.api.PhotoGalleryApi.listAlbums({ search: query, limit: options.limit }).then((res) => res.data);
	}
}
