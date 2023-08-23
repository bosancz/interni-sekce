import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { MemberResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { TitleService } from "src/app/services/title.service";

@Injectable()
export class MemberStoreService {
  currentMember = new BehaviorSubject<MemberResponseWithLinks | null>(null);

  constructor(private api: ApiService, private titleService: TitleService) {}

  async loadMember(id: number) {
    const member = await this.api.members.getMember(id).then((res) => res.data);
    this.currentMember.next(member);
  }
}
