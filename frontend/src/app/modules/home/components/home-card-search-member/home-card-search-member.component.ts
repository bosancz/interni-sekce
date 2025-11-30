import { Component } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Subject, debounceTime } from "rxjs";
import { ApiService } from "src/app/services/api.service";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "bo-home-card-search-member",
	standalone: false,
	templateUrl: "./home-card-search-member.component.html",
	styleUrl: "./home-card-search-member.component.scss",
})
export class HomeCardSearchMemberComponent {
	searchString = new Subject<string>();

	members?: SDK.MemberResponse[];

	searching: boolean = false;

	constructor(private api: ApiService) {}

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
