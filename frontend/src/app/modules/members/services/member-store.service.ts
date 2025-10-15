import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable()
export class MemberStoreService {
	currentMember = new BehaviorSubject<BackendApiTypes.MemberResponseWithLinks | null>(null);

	constructor(private api: BackendApi) {}

	async loadMember(id: number) {
		const member = await this.api.MembersApi.getMember(id).then((res) => res.data);
		this.currentMember.next(member);
	}
}
