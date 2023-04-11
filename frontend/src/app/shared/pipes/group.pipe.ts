import { Pipe, PipeTransform } from "@angular/core";

export type GroupPipeProperty = "name" | "color";

type GroupPipeData = { color: string; name: string };

@Pipe({
  name: "group",
})
export class GroupPipe implements PipeTransform {
  groups = new Map<string, GroupPipeData>();

  defaultValues: GroupPipeData = {
    color: "#000",
    name: "???",
  };

  constructor() {}

  transform(groupId: string | undefined, property: GroupPipeProperty): string | undefined {
    if (!groupId) return this.defaultValues[property];

    switch (property) {
      case "name":
        return this.groups.get(groupId)?.[property] || groupId;
      default:
        return this.groups.get(groupId)?.[property];
    }
  }
}
