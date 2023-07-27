import { Component, OnInit } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { NavController } from "@ionic/angular";
import { GroupResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";

@Component({
  selector: "bo-group-edit",
  templateUrl: "./group-edit.component.html",
  styleUrls: ["./group-edit.component.scss"],
})
export class GroupEditComponent implements OnInit {
  group?: GroupResponseWithLinks;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private toastService: ToastService,
    private navController: NavController,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params["id"]) this.loadGroup(parseInt(params["id"]));
    });
  }

  private async loadGroup(groupId: number) {
    this.group = await this.api.members.getGroup(groupId).then((res) => res.data);
  }

  async editGroup(form: NgForm) {
    const groupData = form.value;

    await this.api.members.updateGroup(this.group!.id, groupData);

    this.toastService.toast("Uloženo.", { color: "success" });

    this.navController.back();
  }
}
