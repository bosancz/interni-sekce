import { Component, Input, OnInit } from "@angular/core";
import { SDK } from "src/sdk";
import { GroupPipe } from "../../pipes/group.pipe";
import { MemberPipe } from "../../pipes/member.pipe";

@Component({
	selector: "bo-member-item-detail",
	templateUrl: "./member-item-detail.component.html",
	styleUrls: ["./member-item-detail.component.scss"],
	
	imports: [GroupPipe, MemberPipe],
})
export class MemberItemDetailComponent implements OnInit {
	@Input() member!: SDK.MemberResponse;

	constructor() {}

	ngOnInit(): void {}
}
