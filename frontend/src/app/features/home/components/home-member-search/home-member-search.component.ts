import { Component, OnInit } from "@angular/core";
import { HomeCardSearchMemberComponent } from "../home-card-search-member/home-card-search-member.component";

@Component({
	selector: "bo-home-member-search",
	templateUrl: "./home-member-search.component.html",
	styleUrls: ["./home-member-search.component.scss"],
	standalone: true,
	imports: [HomeCardSearchMemberComponent],
})
export class HomeMemberSearchComponent implements OnInit {
	constructor() {}

	ngOnInit(): void {}
}
