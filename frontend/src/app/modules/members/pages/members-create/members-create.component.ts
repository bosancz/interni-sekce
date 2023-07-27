import { Component } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ViewWillEnter } from "@ionic/angular";
import { GroupResponseWithLinks } from "src/app/api";
import { MemberRoles } from "src/app/config/member-roles";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";

@Component({
  selector: "members-create",
  templateUrl: "./members-create.component.html",
  styleUrls: ["./members-create.component.scss"],
})
export class MembersCreateComponent implements ViewWillEnter {
  groups?: GroupResponseWithLinks[];
  roles = MemberRoles;

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

  async onSubmit(form: NgForm) {
    const formData = form.value;

    const member = await this.api.members.createMember(formData).then((res) => res.data);
    this.toastService.toast("Člen uložen.");

    this.router.navigate(["../", {}, member.id], { relativeTo: this.route, replaceUrl: true });
  }
}
