import { Component, ViewChild } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { NavController } from "@ionic/angular";
import { Subscription } from "rxjs";
import { MemberResponse } from "src/app/api";
import { MemberGroups } from "src/app/config/member-groups";
import { MemberRoles } from "src/app/config/member-roles";
import { MembershipTypes } from "src/app/config/membership-types";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@Component({
  selector: "members-edit",
  templateUrl: "./members-edit.component.html",
  styleUrls: ["./members-edit.component.scss"],
})
export class MembersEditComponent {
  member?: MemberResponse;

  groups = Object.entries(MemberGroups)
    .map((entry) => ({ key: entry[0], value: entry[1] }))
    .filter((entry) => entry.value.real);

  roles = MemberRoles;
  membershipTypes = MembershipTypes;

  paramsSubscription?: Subscription;

  @ViewChild("memberInfoForm") form!: NgForm;

  actions: Action[] = [
    {
      text: "Uložit",
      pinned: true,
      handler: () => this.saveMember(),
    },
  ];

  constructor(
    private api: ApiService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private navController: NavController,
  ) {}

  ngOnInit() {
    this.paramsSubscription = this.route.params.subscribe((params: Params) => {
      this.loadMember(params["member"]);
    });
  }

  ngOnDestroy() {
    this.paramsSubscription?.unsubscribe();
  }

  async loadMember(memberId: number) {
    this.member = await this.api.members.getMember(memberId).then((res) => res.data);
  }

  async saveMember() {
    if (!this.member) return;

    const memberData = this.form.value;

    await this.api.members.updateMember(this.member.id, memberData);

    await this.loadMember(this.member.id);

    this.toastService.toast("Uloženo.");

    this.navController.navigateBack(["/databaze", this.member.id]);
  }
}
