import { Component, ViewChild } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute, Params } from "@angular/router";
import { NavController, ViewWillEnter } from "@ionic/angular";
import { Subscription } from "rxjs";
import {
  GroupResponseWithLinks,
  MemberResponseMembershipEnum,
  MemberResponseWithLinks,
  MemberResponseWithLinksRoleEnum,
} from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@Component({
  selector: "members-edit",
  templateUrl: "./members-edit.component.html",
  styleUrls: ["./members-edit.component.scss"],
})
export class MembersEditComponent implements ViewWillEnter {
  member?: MemberResponseWithLinks;
  groups?: GroupResponseWithLinks[];

  roles = MemberResponseWithLinksRoleEnum;
  membershipTypes = MemberResponseMembershipEnum;

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
    private navController: NavController,
  ) {}

  ngOnInit() {
    this.paramsSubscription = this.route.params.subscribe((params: Params) => {
      this.loadMember(params["member"]);
    });
  }

  ionViewWillEnter() {
    this.loadGroups();
  }

  ngOnDestroy() {
    this.paramsSubscription?.unsubscribe();
  }

  async loadMember(memberId: number) {
    this.member = await this.api.members.getMember(memberId).then((res) => res.data);
  }

  async loadGroups() {
    this.groups = await this.api.members.listGroups().then((res) => res.data);
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
