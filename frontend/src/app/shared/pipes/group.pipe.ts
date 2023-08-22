import { ChangeDetectorRef, Pipe, PipeTransform } from "@angular/core";
import { GroupResponse } from "src/app/api";
import { ApiService } from "src/app/services/api.service";

export type GroupPipeProperty = "name" | "color";

type GroupPipeData = { color: string; name: string };

@Pipe({
  name: "group",
  pure: false,
})
export class GroupPipe implements PipeTransform {
  groups = new Map<number, GroupResponse>();

  defaultValues: GroupPipeData = {
    color: "#000",
    name: "???",
  };

  constructor(private api: ApiService, private cdRef: ChangeDetectorRef) {
    this.api.cache.groups.subscribe((groups) => {
      if (!groups) return;

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
      default:
        return group[property] ?? "???";
    }
  }
}
