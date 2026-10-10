import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { ApiService } from "src/app/core/services/api.service";
import { GroupsService as GroupsListService } from "src/app/core/services/groups.service";
import { SDK } from "src/sdk";

@Injectable({
	providedIn: "root",
})
export class GroupsService {
	currentGroup = new BehaviorSubject<SDK.GroupResponseWithLinks | null | undefined>(undefined);

	constructor(
		private api: ApiService,
		private groupsListService: GroupsListService,
	) {}

	async loadGroup(shortName: string) {
		this.currentGroup.next(undefined);
		const listedGroup = await this.groupsListService.getGroupByShortName(shortName);
		if (!listedGroup) return this.currentGroup.next(null);

		const group = await this.api.MembersApi.getGroup(listedGroup.id).then((res) => res.data);
		this.currentGroup.next(group);
	}
}
