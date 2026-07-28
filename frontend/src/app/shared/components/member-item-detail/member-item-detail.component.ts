import { Component, input, OnInit } from "@angular/core";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-member-item-detail",
	templateUrl: "./member-item-detail.component.html",
	styleUrls: ["./member-item-detail.component.scss"],
	imports: [],
})
export class MemberItemDetailComponent implements OnInit {
	member = input.required<SDK.MemberResponse>();

	constructor() {}

	ngOnInit(): void {}
}
