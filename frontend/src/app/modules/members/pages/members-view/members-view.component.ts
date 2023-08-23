import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertController, ViewWillEnter, ViewWillLeave } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MemberResponseWithLinks } from "src/app/api";
import { MembershipStates } from "src/app/config/membership-states";
import { ApiService } from "src/app/services/api.service";
import { TitleService } from "src/app/services/title.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { MemberStoreService } from "../../services/member-store.service";

@UntilDestroy()
@Component({
  selector: "members-view",
  templateUrl: "./members-view.component.html",
  styleUrls: ["./members-view.component.scss"],
  providers: [MemberStoreService],
})
export class MembersViewComponent implements OnInit, ViewWillEnter, ViewWillLeave {
  member?: MemberResponseWithLinks | null;

  membershipStates = MembershipStates;

  actions: Action[] = [
    {
      text: "Upravit",
      pinned: true,
      icon: "create",
      handler: () => this.router.navigate(["upravit"], { relativeTo: this.route }),
    },
    {
      text: "Smazat",
      role: "destructive",
      icon: "trash",
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
    private memberStore: MemberStoreService,
    private titleService: TitleService,
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(untilDestroyed(this))
      .subscribe((params) => this.memberStore.loadMember(parseInt(params.member)));

    this.memberStore.currentMember.pipe(untilDestroyed(this)).subscribe((member) => (this.member = member));
  }

  ionViewWillEnter() {
    this.memberStore.currentMember
      .pipe(untilDestroyed(this, "ionViewWillLeave"))
      .subscribe((member) => this.titleService.setTitle(member?.nickname ?? null));
  }

  ionViewWillLeave(): void {}

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

    await this.api.members.deleteMember(this.member?.id);

    this.toastService.toast(`Člen ${this.member?.nickname} smazán.`);

    this.router.navigate(["../"], { relativeTo: this.route, replaceUrl: true });
  }

  getFullName(member?: MemberResponseWithLinks | null) {
    if (!member) return "";
    return (
      member.nickname + (member?.firstName || member.lastName ? ` (${member?.firstName} ${member?.lastName})` : "")
    );
  }

  getAge(member?: MemberResponseWithLinks) {}
}
