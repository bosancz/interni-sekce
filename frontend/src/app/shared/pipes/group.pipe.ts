import { ChangeDetectorRef, Injectable, Pipe, PipeTransform } from "@angular/core";
import { GroupsService } from "src/app/services/groups.service";
import { SDK } from "src/sdk";

export type GroupPipeProperty = "name" | "color" | "code";

type GroupPipeData = { color: string; name: string; code: string };

@Pipe({
	name: "group",
	pure: false,
	standalone: false,
})
@Injectable({
	providedIn: "root",
})
export class GroupPipe implements PipeTransform {
	groupsMap = new Map<number, SDK.GroupResponse>();

	defaultValues: GroupPipeData = {
		color: "#000",
		name: "???",
		code: "?",
	};

	constructor(
		private readonly groupsService: GroupsService,
		private readonly cdRef: ChangeDetectorRef,
	) {
		this.groupsService.groups.subscribe((groups) => {
			this.groupsMap = new Map(groups.map((group) => [group.id, group]));
			this.cdRef.markForCheck();
		});
	}

	transform(groupId: number | undefined, property: GroupPipeProperty): string | undefined {
		if (!groupId || !this.groupsMap.has(groupId)) return this.defaultValues[property];

		const group = this.groupsMap.get(groupId)!;

		switch (property) {
			case "name":
				return group.name ?? group.shortName;
			case "code":
				return group.shortName ?? "?";
			default:
				return group[property] ?? "???";
		}
	}
}
