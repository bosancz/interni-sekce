import { Component, Input, OnInit } from "@angular/core";
import { MemberResponse } from "src/app/api";

@Component({
  selector: "bo-member-item-detail",
  templateUrl: "./member-item-detail.component.html",
  styleUrls: ["./member-item-detail.component.scss"],
})
export class MemberItemDetailComponent implements OnInit {
  @Input() member!: MemberResponse;

  constructor() {}

  ngOnInit(): void {}
}
