import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertController, ViewWillEnter, ViewWillLeave } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MemberResponse, MemberResponseWithLinks } from "src/app/api";
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
  view?: "info" | "zdravi" | "kontakty" = "info";

  membershipStates = MembershipStates;

  actions: Action[] = [
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
    private titleService: TitleService,
  ) {}

  ngOnInit() {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      if (this.member?.id !== parseInt(params.member)) this.loadMember(parseInt(params.member));
    });

    this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => {
      if (params.view) {
        this.view = params.view;
      } else {
        this.router.navigate([], { relativeTo: this.route, queryParams: { view: "info" }, replaceUrl: true });
      }
    });
  }

  ionViewWillEnter(): void {}

  ionViewWillLeave(): void {}

  async loadMember(id: number) {
    this.member = await this.api.members.getMember(id).then((res) => res.data);
    this.titleService.setTitle(this.member?.nickname ?? null);
  }

  async updateMember(data: Partial<MemberResponse>) {
    if (!this.member) return;

    const toast = await this.toastService.toast("Ukládám...");

    await this.api.members.updateMember(this.member.id, data);

    await this.loadMember(this.member.id);

    toast.dismiss();
    this.toastService.toast("Uloženo.");
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
