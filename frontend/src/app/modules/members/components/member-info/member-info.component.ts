import { Component, OnInit } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MemberResponseWithLinks } from "src/app/api";
import { MemberStoreService } from "../../services/member-store.service";

@UntilDestroy()
@Component({
  selector: "bo-member-info",
  templateUrl: "./member-info.component.html",
  styleUrls: ["./member-info.component.scss"],
})
export class MemberInfoComponent implements OnInit {
  member?: MemberResponseWithLinks | null;

  constructor(private memberStore: MemberStoreService) {}

  ngOnInit(): void {
    this.memberStore.currentMember.pipe(untilDestroyed(this)).subscribe((member) => (this.member = member));
  }
}
