import { Component } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute, Params } from "@angular/router";
import { NavController, ViewWillEnter, ViewWillLeave } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Subscription } from "rxjs";
import { MemberResponseWithLinks, MemberUpdateBody } from "src/app/api";
import { MemberRoles } from "src/app/config/member-roles";
import { MembershipStates } from "src/app/config/membership-states";
import { ApiService } from "src/app/services/api.service";
import { TitleService } from "src/app/services/title.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { deepCopy } from "src/helpers/object";

@UntilDestroy()
@Component({
  selector: "members-edit",
  templateUrl: "./members-edit.component.html",
  styleUrls: ["./members-edit.component.scss"],
})
export class MembersEditComponent implements ViewWillEnter, ViewWillLeave {
  member?: MemberResponseWithLinks;

  roles = MemberRoles;
  membershipStates = MembershipStates;

  paramsSubscription?: Subscription;

  formData: MemberUpdateBody = {};

  actions: Action[] = [
    {
      text: "Zrušit",
      pinned: true,
      handler: () => this.navController.navigateBack(["/databaze", this.member?.id]),
    },
  ];

  constructor(
    private api: ApiService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private navController: NavController,
    private titleService: TitleService,
  ) {}

  ionViewWillEnter() {
    this.route.params.pipe(untilDestroyed(this, "ionViewWillLeave")).subscribe((params: Params) => {
      this.loadMember(params["member"]);
    });
  }

  ionViewWillLeave(): void {}

  async loadMember(memberId: number) {
    this.member = await this.api.members.getMember(memberId).then((res) => res.data);
    this.formData = deepCopy(this.member);
    this.titleService.setTitle(this.member.nickname ? "Upravit: " + this.member.nickname : null);
  }

  async saveMember(form: NgForm) {
    if (!this.formData || !this.member) return;

    await this.api.members.updateMember(this.member.id, this.formData);

    await this.loadMember(this.member.id);

    this.toastService.toast("Uloženo.");

    this.navController.navigateBack(["/databaze", this.member.id]);
  }
}
