import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { MemberResponseWithLinks } from "src/app/api";
import { MemberStoreService } from "../../services/member-store.service";
@UntilDestroy()
@Component({
  selector: "bo-member-health",
  templateUrl: "./member-health.component.html",
  styleUrls: ["./member-health.component.scss"],
})
export class MemberHealthComponent implements OnInit {
  @Input() member?: MemberResponseWithLinks | null;
  @Output() update = new EventEmitter<Partial<MemberResponseWithLinks>>();

  constructor(private memberStore: MemberStoreService) {}

  ngOnInit(): void {}
}
