import { Component, Input, OnInit } from "@angular/core";

@Component({
	selector: "bo-member-item-detail",
	templateUrl: "./member-item-detail.component.html",
	styleUrls: ["./member-item-detail.component.scss"],
	standalone: false,
})
export class MemberItemDetailComponent implements OnInit {
	@Input() member!: BackendApiTypes.MemberResponse;

	constructor() {}

	ngOnInit(): void {}
}
