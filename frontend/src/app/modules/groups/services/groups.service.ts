import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { ApiService } from "src/app/services/api.service";
import { SDK } from "src/sdk";

@Injectable({
  providedIn: "root",
})
export class GroupsService {
  currentGroup = new BehaviorSubject<SDK.GroupResponseWithLinks | null | undefined>(undefined);

  constructor(private api: ApiService) {}

  async loadGroup(groupId: number) {
    this.currentGroup.next(undefined);
    const group = await this.api.MembersApi.getGroup(groupId).then((res) => res.data);
    this.currentGroup.next(group);
  }
}
