import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { GroupResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";

@Injectable({
  providedIn: "root",
})
export class GroupsService {
  currentGroup = new BehaviorSubject<GroupResponseWithLinks | null | undefined>(undefined);

  constructor(private api: ApiService) {}

  async loadGroup(groupId: number) {
    this.currentGroup.next(undefined);
    const group = await this.api.members.getGroup(groupId).then((res) => res.data);
    this.currentGroup.next(group);
  }
}
