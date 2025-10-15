import { Component, OnInit } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";

@UntilDestroy()
@Component({
	selector: "bo-home-card-members",
	templateUrl: "./home-card-members.component.html",
	styleUrls: ["./home-card-members.component.scss"],
	standalone: false,
})
export class HomeCardMembersComponent implements OnInit {
	searchString = new Subject<string>();

	members?: BackendApiTypes.MemberResponse[];

	searching: boolean = false;

	constructor(private api: BackendApi) {}

	ngOnInit(): void {
		this.searchString
			.pipe(untilDestroyed(this))
			.pipe(debounceTime(500))
			.subscribe((searchString) => this.loadMembers(searchString));
	}

	async loadMembers(searchString: string) {
		console.log("search", searchString);
		this.searching = false;
		if (searchString) {
			this.members = await this.api.MembersApi.listMembers({ search: searchString }).then((res) => res.data);
		} else {
			this.clearMembers();
		}
	}

	clearMembers() {
		this.members = undefined;
	}
}
