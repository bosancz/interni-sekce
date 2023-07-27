import { Component, OnInit } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MemberResponseWithLinks } from "src/app/api";
import { MembersService } from "../../services/members.service";

@UntilDestroy()
@Component({
  selector: "bo-member-health",
  templateUrl: "./member-health.component.html",
  styleUrls: ["./member-health.component.scss"],
})
export class MemberHealthComponent implements OnInit {
  member?: MemberResponseWithLinks | null;
  insuranceCardUrl?: string | null;

  constructor(private membersService: MembersService) {}

  ngOnInit(): void {
    this.membersService.currentMember.pipe(untilDestroyed(this)).subscribe((member) => {
      this.member = member;

      this.insuranceCardUrl =
        member?._links?.getInsuranceCard.applicable && member?._links?.getInsuranceCard.applicable
          ? member._links.getInsuranceCard.href
          : null;
    });
  }

  uploadCard() {}
}
