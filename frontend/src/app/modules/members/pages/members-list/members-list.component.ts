import { DatePipe } from "@angular/common";
import { Component, OnInit, ViewChild } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Platform, ViewWillEnter } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DateTime } from "luxon";
import { debounceTime } from "rxjs/operators";
import { MemberResponse } from "src/app/api";
import { MemberGroups } from "src/app/config/member-groups";
import { MemberRoles } from "src/app/config/member-roles";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

type MemberWithSearchString = MemberResponse & { searchString: string };

interface TableFilter {
  search?: string;
  groups?: string[];
  roles?: string[];
  activity?: "active" | "inactive";
  fields: Fields[];
}

enum Fields {
  "nickname" = "nickname",
  "group" = "group",
  "role" = "role",
  "post" = "post",
  "rank" = "rank",
  "stars" = "stars",
  "name" = "name",
  "birthday" = "birthday",
  "age" = "age",
  "email" = "email",
  "mobile" = "mobile",
  "city" = "city",
}

interface FieldData {
  id: Fields;
  title: string;
  header?: boolean;
}

interface TableRow {
  member: MemberResponse;
  cells: string[];
}

@UntilDestroy()
@Component({
  selector: "members-list",
  templateUrl: "./members-list.component.html",
  styleUrls: ["./members-list.component.scss"],
})
export class MembersListComponent implements OnInit, ViewWillEnter {
  members?: MemberWithSearchString[];

  filter: TableFilter = {
    activity: "active",
    fields: [Fields.nickname, Fields.group, Fields.role, Fields.name, Fields.age],
  };

  tableRows: TableRow[] = [];
  tableColumns: FieldData[] = [];

  style: "list" | "table" = this.platform.isPortrait() ? "list" : "table";

  showFilter: boolean = false;

  fields: FieldData[] = [
    { id: Fields.nickname, title: "Přezdívka", header: true },
    { id: Fields.group, title: "Oddíl" },
    { id: Fields.role, title: "Role" },
    { id: Fields.post, title: "Funkce" },
    { id: Fields.name, title: "Jméno" },
    { id: Fields.rank, title: "Hodnost" },
    { id: Fields.stars, title: "Hvězdy" },
    { id: Fields.birthday, title: "Datum narození" },
    { id: Fields.age, title: "Věk" },
    { id: Fields.email, title: "Email" },
    { id: Fields.mobile, title: "Mobil" },
    { id: Fields.city, title: "Město" },
  ];

  filteredFields: FieldData[] = [];

  actions: Action[] = [
    {
      icon: "add-outline",
      pinned: true,
      text: "Přidat",
      handler: () => this.create(),
    },
  ];

  groups = MemberGroups;
  roles = MemberRoles;

  @ViewChild("filterForm", { static: true }) filterForm?: NgForm;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private datePipe: DatePipe,
    private toasts: ToastService,
    private platform: Platform,
  ) {}

  ngOnInit() {
    this.platform.resize.pipe(untilDestroyed(this)).subscribe(() => {
      this.style = this.platform.isPortrait() ? "list" : "table";
    });
  }

  ionViewWillEnter() {
    this.loadMembers();
  }

  ngAfterViewInit() {
    this.filterForm!.valueChanges!.pipe(debounceTime(250)).subscribe((filter) => this.filterData(filter));
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

    this.filterData(this.filterForm?.value);
  }

  private create() {
    this.router.navigate(["pridat"], { relativeTo: this.route });
  }

  private filterData(filter: TableFilter) {
    if (this.members) {
      const search_re = filter.search
        ? new RegExp("(^| )" + filter.search.replace(/ /g, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
        : undefined;

      const filteredMembers = this.members.filter((member) => {
        if (search_re && !search_re.test(member.searchString)) return false;
        if (filter.roles && filter.roles.length && (!member.role || filter.roles.indexOf(member.role) === -1))
          return false;
        if (filter.groups && filter.groups.length && filter.groups.indexOf(member.groupId) === -1) return false;
        if (
          filter.activity &&
          filter.activity.length &&
          filter.activity.indexOf(member.active ? "active" : "inactive") === -1
        )
          return false;

        return true;
      });

      this.tableRows = filteredMembers.map((member) => ({
        member,
        cells: filter.fields?.map((field) => this.getFieldValue(member, field) || ""),
      }));
    } else {
      this.tableRows = [];
    }

    this.tableColumns = filter.fields.map((field) => this.fields.find((item) => item.id === field)!);
  }

  private sortMembers(members: MemberResponse[]): void {
    const groupIndex = Object.keys(this.groups);
    const roleIndex = Object.keys(this.roles);

    members.sort(
      (a, b) =>
        Number(b.active) - Number(a.active) ||
        (a.group && b.group && groupIndex.indexOf(a.groupId) - groupIndex.indexOf(b.groupId)) ||
        (a.role && b.role && roleIndex.indexOf(a.role) - roleIndex.indexOf(b.role)) ||
        (a.nickname && b.nickname && a.nickname.localeCompare(b.nickname)) ||
        0,
    );
  }

  getAge(birthday: string) {
    return Math.floor(-1 * DateTime.fromISO(birthday).diffNow("years").years).toFixed(0);
  }

  getFieldValue(member: MemberResponse, field: Fields) {
    switch (field) {
      case "nickname":
        return member.nickname || member.firstName;
      case "name":
        return `${member.firstName} ${member.lastName}`;
      case "birthday":
        return this.datePipe.transform(member.birthday, "d. M. y") || undefined;
      case "age":
        return member.birthday ? this.getAge(member.birthday) : undefined;

      default:
        return (<any>member)[field];
    }
  }
}