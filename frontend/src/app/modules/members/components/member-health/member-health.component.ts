import { Component, OnInit } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MemberResponseWithLinks } from "src/app/api";
import { MemberStoreService } from "../../services/member-store.service";
@UntilDestroy()
@Component({
  selector: "bo-member-health",
  templateUrl: "./member-health.component.html",
  styleUrls: ["./member-health.component.scss"],
})
export class MemberHealthComponent implements OnInit {
  member?: MemberResponseWithLinks | null;

  constructor(private memberStore: MemberStoreService) {}

  ngOnInit(): void {
    this.memberStore.currentMember.pipe(untilDestroyed(this)).subscribe((member) => {
      this.member = member;
    });
  }
}
