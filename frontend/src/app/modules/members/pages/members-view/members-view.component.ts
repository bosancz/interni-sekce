import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertController, ViewWillEnter } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MemberResponse } from "src/app/api";
import { MembershipTypes } from "src/app/config/membership-types";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@UntilDestroy()
@Component({
  selector: "members-view",
  templateUrl: "./members-view.component.html",
  styleUrls: ["./members-view.component.scss"],
})
export class MembersViewComponent implements OnInit, ViewWillEnter {
  member?: MemberResponse;

  membershipTypes = MembershipTypes;

  actions: Action[] = [
    {
      text: "Upravit",
      pinned: true,
      icon: "create-outline",
      handler: () => this.router.navigate(["upravit"], { relativeTo: this.route }),
    },
    {
      text: "Smazat",
      role: "destructive",
      color: "danger",
      handler: () => this.delete(),
    },
  ];

  constructor(
    private api: ApiService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private alertController: AlertController,
  ) {}

  ngOnInit() {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => this.loadMember(params.member));
  }

  ionViewWillEnter() {}

  // DB interaction
  async loadMember(memberId: number) {
    this.member = await this.api.members.getMember(memberId).then((res) => res.data);
  }

  async delete() {
    if (!this.member) return;

    const alert = await this.alertController.create({
      header: "Smazat člena?",
      message: `Opravdu chcete smazat člena „<strong>${this.getFullName(this.member)}</strong>“?`,
      buttons: [{ text: "Zrušit" }, { text: "Smazat", handler: () => this.deleteConfirmed() }],
    });

    await alert.present();
  }

  async deleteConfirmed() {
    if (!this.member) return;

    await this.api.members.deleteMember(this.member.id);

    this.toastService.toast(`Člen ${this.member?.nickname} smazán.`);

    this.router.navigate(["../"], { relativeTo: this.route, replaceUrl: true });
  }

  getFullName(member?: MemberResponse) {
    if (!member) return "";
    return (
      member.nickname + (member?.firstName || member.lastName ? ` (${member?.firstName} ${member?.lastName})` : "")
    );
  }

  getAge(member?: MemberResponse) {}
}
