import { Component, Input, OnInit } from "@angular/core";
import { SDK } from "src/sdk";

@Component({
  selector: "bo-member-item-detail",
  templateUrl: "./member-item-detail.component.html",
  styleUrls: ["./member-item-detail.component.scss"],
  standalone: false,
})
export class MemberItemDetailComponent implements OnInit {
  @Input() member!: SDK.MemberResponse;

  constructor() {}

  ngOnInit(): void {}
}
