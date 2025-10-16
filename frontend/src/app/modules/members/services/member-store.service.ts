import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { ApiService } from "src/app/services/api.service";
import { BackendApiTypes } from "src/sdk/backend.client";

@Injectable()
export class MemberStoreService {
	currentMember = new BehaviorSubject<BackendApiTypes.MemberResponseWithLinks | null>(null);

	constructor(private api: ApiService) {}

	async loadMember(id: number) {
		const member = await this.api.get("/api/members/{id}", { params: { id } }).then((res) => res.data);
		this.currentMember.next(member);
	}
}
