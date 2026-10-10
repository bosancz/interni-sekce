import { Injectable } from "@angular/core";
import { firstValueFrom, map, shareReplay, skip, Subject, tap } from "rxjs";
import { SDK } from "src/sdk";
import { Logger } from "src/logger";
import { ApiService } from "./api.service";

@Injectable({
	providedIn: "root",
})
export class GroupsService {
	private readonly logger = new Logger("GroupsService");

	private readonly reloadEvent = new Subject<void>();

	readonly groups = this.api
		.watch((signal) => this.api.MembersApi.listGroups({}, { signal }), { customTrigger: this.reloadEvent })
		.pipe(tap(() => this.logger.debug("Fetched groups")))
		.pipe(map((res) => res.data))
		.pipe(shareReplay(1));

	constructor(private readonly api: ApiService) {}

	reload() {
		this.reloadEvent.next();
	}

	getGroupByShortName(shortName: string) {
		return this.findGroup((group) => group.shortName === shortName);
	}

	getGroupById(groupId: number) {
		return this.findGroup((group) => group.id === groupId);
	}

	private async findGroup(predicate: (group: SDK.GroupResponseWithLinks) => boolean) {
		const group = (await firstValueFrom(this.groups)).find(predicate);
		if (group) return group;

		const reloaded = firstValueFrom(this.groups.pipe(skip(1)));
		this.reload();
		return (await reloaded).find(predicate);
	}
}
