import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { ApiService } from "src/app/services/api.service";
import { SDK } from "src/sdk";

@Injectable()
export class MemberStoreService {
	currentMember = new BehaviorSubject<SDK.MemberResponseWithLinks | null>(null);

	constructor(private api: ApiService) {}

	async loadMember(id: number) {
		const member = await this.api.MembersApi.getMember(id).then((res) => res.data);
		this.currentMember.next(member);
	}
}
