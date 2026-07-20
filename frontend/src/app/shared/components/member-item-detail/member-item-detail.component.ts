import { Component, input, OnInit } from "@angular/core";
import { SDK } from "src/sdk";
import { MemberPipe } from "../../pipes/member.pipe";

@Component({
	selector: "bo-member-item-detail",
	templateUrl: "./member-item-detail.component.html",
	styleUrls: ["./member-item-detail.component.scss"],

	imports: [MemberPipe],
})
export class MemberItemDetailComponent implements OnInit {
	member = input.required<SDK.MemberResponse>();

	constructor() {}

	ngOnInit(): void {}
}
