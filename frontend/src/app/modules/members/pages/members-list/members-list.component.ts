import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ViewWillEnter } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DateTime } from "luxon";
import { tap } from "rxjs/operators";
import { GroupResponseWithLinks, MemberResponseWithLinks, MemberRolesEnum, MembershipStatesEnum } from "src/app/api";
import { MemberRoles } from "src/app/config/member-roles";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { MembershipStates } from "../../../../config/membership-states";

type MemberWithSearchString = MemberResponseWithLinks & { searchString: string };

interface TableFilter {
  search?: string;
  groups?: number[];
  roles?: MemberRolesEnum[];
  membership?: MembershipStatesEnum[];
}

@UntilDestroy()
@Component({
  selector: "members-list",
  templateUrl: "./members-list.component.html",
  styleUrls: ["./members-list.component.scss"],
})
export class MembersListComponent implements OnInit, AfterViewInit, ViewWillEnter {
  members?: MemberWithSearchString[];
  groups?: GroupResponseWithLinks[];
  roles = MemberRoles;
  membershipStates = MembershipStates;

  filteredMembers?: MemberWithSearchString[];

  loadingRows = new Array(10).fill(null);

  filter: TableFilter = {
    membership: ["clen"],
  };

  actions: Action[] = [
    {
      icon: "add-outline",
      pinned: true,
      text: "Přidat",
      handler: () => this.create(),
    },
  ];

  @ViewChild("filterForm") filterForm?: NgForm;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private toasts: ToastService,
  ) {}

  ngOnInit() {}

  ngAfterViewInit(): void {
    this.filterForm?.valueChanges
      ?.pipe(untilDestroyed(this), tap(console.log))
      .subscribe((filter) => this.filterMembers({ ...this.filter, ...filter }));
  }

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

    this.members = members;

    this.sortMembers();
    this.filterMembers(this.filter);
  }

  private async loadGroups() {
    this.groups = await this.api.members.listGroups().then((res) => res.data);
  }

  private create() {
    this.router.navigate(["pridat"], { relativeTo: this.route });
  }

  public filterMembers(filter: TableFilter) {
    if (!this.members) {
      this.filteredMembers = [];
      return;
    }

    const search_re = filter.search
      ? new RegExp("(^| )" + filter.search.replace(/ /g, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      : undefined;

    this.filteredMembers = this.members.filter((member) => {
      if (search_re && !search_re.test(member.searchString)) return false;
      if (filter.roles && filter.roles.length && (!member.role || filter.roles.indexOf(member.role) === -1))
        return false;
      if (filter.groups && filter.groups.length && filter.groups.indexOf(member.groupId) === -1) return false;
      if (filter.membership && filter.membership.length && filter.membership.indexOf(member.membership) === -1)
        return false;

      return true;
    });
  }

  private sortMembers(): void {
    // const groupIndex = Object.keys(this.groups);
    // const roleIndex = Object.keys(this.roles);
    // FIXME: sort by group and role

    const roleOrder: MemberRolesEnum[] = ["vedouci", "instruktor", "dite"];

    this.members?.sort(
      (a, b) =>
        Number(b.active) - Number(a.active) ||
        (a.group && b.group && a.group.shortName.localeCompare(b.group.shortName)) ||
        (a.role && b.role && roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)) ||
        (a.nickname && b.nickname && a.nickname.localeCompare(b.nickname)) ||
        0,
    );
  }

  getAge(birthday: string) {
    return Math.floor(-1 * DateTime.fromISO(birthday).diffNow("years").years).toFixed(0);
  }
}
