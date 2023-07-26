import { Component, ViewChild } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ViewWillEnter } from "@ionic/angular";
import { GroupResponseWithLinks, MemberResponseRoleEnum } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@Component({
  selector: "members-create",
  templateUrl: "./members-create.component.html",
  styleUrls: ["./members-create.component.scss"],
})
export class MembersCreateComponent implements ViewWillEnter {
  groups?: GroupResponseWithLinks[];
  roles = MemberResponseRoleEnum;

  actions: Action[] = [
    {
      text: "Přidat",
      handler: () => this.create(),
    },
  ];

  @ViewChild("createMemberForm") form!: NgForm;

  constructor(
    private api: ApiService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ionViewWillEnter() {
    this.loadGroups();
  }

  private async loadGroups() {
    this.groups = await this.api.members.listGroups().then((res) => res.data);
  }

  async create() {
    const formData = this.form.value;

    const member = await this.api.members.createMember(formData).then((res) => res.data);
    this.toastService.toast("Člen uložen.");

    this.router.navigate(["../", {}, member.id], { relativeTo: this.route, replaceUrl: true });
  }
}
