import { ChangeDetectorRef, Pipe, PipeTransform } from "@angular/core";
import { map } from "rxjs";
import { BackendApi, BackendApiTypes } from "src/sdk/backend.client";

export type GroupPipeProperty = "name" | "color" | "code";

type GroupPipeData = { color: string; name: string; code: string };

@Pipe({
	name: "group",
	pure: false,
	standalone: false,
})
export class GroupPipe implements PipeTransform {
	groups = new Map<number, BackendApiTypes.GroupResponse>();

	defaultValues: GroupPipeData = {
		color: "#000",
		name: "???",
		code: "?",
	};

	constructor(
		private api: BackendApi,
		private cdRef: ChangeDetectorRef,
	) {
		this.api
			.watchRequest((signal) => this.api.GET("/api/groups")
			.pipe(map((res) => res.data))
			.subscribe((groups) => {
				this.groups = new Map(groups.map((group) => [group.id, group]));
				this.cdRef.markForCheck();
			});
	}

	transform(groupId: number | undefined, property: GroupPipeProperty): string | undefined {
		if (!groupId || !this.groups.has(groupId)) return this.defaultValues[property];

		const group = this.groups.get(groupId)!;

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
