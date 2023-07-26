import { DatePipe } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ViewWillEnter } from "@ionic/angular";
import { UntilDestroy } from "@ngneat/until-destroy";
import { DateTime } from "luxon";
import { GroupResponseWithLinks, MemberResponse, MemberResponseRankEnum, MemberResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

type MemberWithSearchString = MemberResponseWithLinks & { searchString: string };

interface TableFilter {
  search?: string;
  groups?: number[];
  ranks?: MemberResponseRankEnum[];
  status?: ("active" | "inactive")[];
}

@UntilDestroy()
@Component({
  selector: "members-list",
  templateUrl: "./members-list.component.html",
  styleUrls: ["./members-list.component.scss"],
})
export class MembersListComponent implements OnInit, ViewWillEnter {
  members?: MemberWithSearchString[];
  groups?: GroupResponseWithLinks[];
  ranks = MemberResponseRankEnum;

  filteredMembers?: MemberWithSearchString[];

  loadingRows = new Array(10).fill(null);

  filter: TableFilter = {
    status: ["active"],
  };

  actions: Action[] = [
    {
      icon: "add-outline",
      pinned: true,
      text: "Přidat",
      handler: () => this.create(),
    },
  ];

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private datePipe: DatePipe,
    private toasts: ToastService,
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.loadMembers();
    this.loadGroups();
  }

  copyRow(cells: string[]) {
    const data = cells.join("\t");

    navigator.clipboard.writeText(data);

    this.toasts.toast("Zkopírováno do schránky.");
  }

  private async loadMembers() {
    const members = (await this.api.members.listMembers().then((res) => res.data)).map((member) => {
      const searchString = [
        member.nickname,
        member.firstName,
        member.lastName,
        member.birthday ? DateTime.fromISO(member.birthday).year : undefined,
        member.email,
        member.mobile && member.mobile.replace(/[^0-9]/g, "").replace("+420", ""),
        member.addressCity,
      ]
        .filter((item) => !!item)
        .join(" ");
      return { ...member, searchString };
    });

    this.sortMembers(members);

    this.members = members;

    this.filterData(this.filter);
  }

  private async loadGroups() {
    this.groups = await this.api.members.listGroups().then((res) => res.data);
  }

  private create() {
    this.router.navigate(["pridat"], { relativeTo: this.route });
  }

  public filterData(filter: TableFilter) {
    if (!this.members) {
      this.filteredMembers = [];
      return;
    }

    const search_re = filter.search
      ? new RegExp("(^| )" + filter.search.replace(/ /g, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      : undefined;

    this.filteredMembers = this.members.filter((member) => {
      if (search_re && !search_re.test(member.searchString)) return false;
      if (filter.ranks && filter.ranks.length && (!member.rank || filter.ranks.indexOf(member.rank) === -1))
        return false;
      if (filter.groups && filter.groups.length && filter.groups.indexOf(member.groupId) === -1) return false;
      if (filter.status && filter.status.length && filter.status.indexOf(member.active ? "active" : "inactive") === -1)
        return false;

      return true;
    });
  }

  private sortMembers(members: MemberResponse[]): void {
    // const groupIndex = Object.keys(this.groups);
    // const roleIndex = Object.keys(this.roles);
    // FIXME: sort by group and role

    const roleOrder: MemberResponseRankEnum[] = ["vedouci", "instruktor", "dite"];

    members.sort(
      (a, b) =>
        Number(b.active) - Number(a.active) ||
        (a.group && b.group && a.group.shortName.localeCompare(b.group.shortName)) ||
        (a.rank && b.rank && roleOrder.indexOf(a.rank) - roleOrder.indexOf(b.rank)) ||
        (a.nickname && b.nickname && a.nickname.localeCompare(b.nickname)) ||
        0,
    );
  }

  getAge(birthday: string) {
    return Math.floor(-1 * DateTime.fromISO(birthday).diffNow("years").years).toFixed(0);
  }
}
