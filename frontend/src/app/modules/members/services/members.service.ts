import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { MemberResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";

@Injectable({
  providedIn: "root",
})
export class MembersService {
  currentMember = new BehaviorSubject<MemberResponseWithLinks | null>(null);

  constructor(private api: ApiService) {}

  async loadMember(id: number) {
    const member = await this.api.members.getMember(id).then((res) => res.data);
    this.currentMember.next(member);
  }
}
