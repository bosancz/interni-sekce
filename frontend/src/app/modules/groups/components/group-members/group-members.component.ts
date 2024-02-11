import { Component, OnInit } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MemberResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { GroupsService } from "../../services/groups.service";

@UntilDestroy()
@Component({
  selector: "bo-group-members",
  templateUrl: "./group-members.component.html",
  styleUrls: ["./group-members.component.scss"],
})
export class GroupMembersComponent implements OnInit {
  members?: (MemberResponseWithLinks & { searchString?: string })[];
  filteredMembers?: MemberResponseWithLinks[];

  sortField: "nickname" | "age" = "nickname";

  filter: { search: string } = {
    search: "",
  };

  constructor(
    private api: ApiService,
    private groupsService: GroupsService,
  ) {}

  ngOnInit(): void {
    this.groupsService.currentGroup.pipe(untilDestroyed(this)).subscribe((group) => this.loadMembers(group?.id));
  }

  private async loadMembers(groupId?: number) {
    if (!groupId) {
      this.members = undefined;
      return;
    }

    this.members = await this.api.members.listMembers({ groups: [groupId] }).then((res) => res.data);

    this.members.forEach((member) => {
      member.searchString = [member.nickname, member.firstName, member.lastName].join(" ");
    });

    this.sortMembers();
    this.filterMembers();
  }

  sortMembers() {
    this.members?.sort((a, b) => {
      switch (this.sortField) {
        case "nickname":
          return a.nickname.localeCompare(b.nickname);
        case "age":
          return (a.birthday || "").localeCompare(b.birthday || "");
        default:
          return 0;
      }
    });
  }

  filterMembers() {
    const search_re = this.filter.search
      ? new RegExp("(^| )" + this.filter.search.replace(/ /g, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      : undefined;

    this.filteredMembers = this.members?.filter((member) => {
      if (search_re && !search_re.test(member.searchString!)) return false;
      return true;
    });
  }
}
