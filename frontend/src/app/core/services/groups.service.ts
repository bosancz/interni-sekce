import { Injectable } from "@angular/core";
import { map, shareReplay, tap } from "rxjs";
import { Logger } from "src/logger";
import { ApiService } from "./api.service";

@Injectable({
	providedIn: "root",
})
export class GroupsService {
	private readonly logger = new Logger("GroupsService");

	readonly groups = this.api
		.watch((signal) => this.api.MembersApi.listGroups({}, { signal }))
		.pipe(tap(() => this.logger.debug("Fetched groups")))
		.pipe(map((res) => res.data))
		.pipe(shareReplay(1));

	constructor(private readonly api: ApiService) {}
}
