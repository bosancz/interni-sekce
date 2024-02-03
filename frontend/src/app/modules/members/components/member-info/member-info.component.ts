import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { MemberResponse, MemberResponseWithLinks } from "src/app/api";

@UntilDestroy()
@Component({
  selector: "bo-member-info",
  templateUrl: "./member-info.component.html",
  styleUrls: ["./member-info.component.scss"],
})
export class MemberInfoComponent implements OnInit {
  @Input() member?: MemberResponseWithLinks | null;
  @Output() update = new EventEmitter<Partial<MemberResponse>>();

  constructor() {}

  ngOnInit(): void {}
}
