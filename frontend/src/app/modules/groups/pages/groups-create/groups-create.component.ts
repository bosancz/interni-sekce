import { Component } from "@angular/core";
import { NgForm } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { NavController } from "@ionic/angular";
import { ApiService } from "src/app/services/api.service";

@Component({
  selector: "bo-groups-create",
  templateUrl: "./groups-create.component.html",
  styleUrls: ["./groups-create.component.scss"],
})
export class GroupsCreateComponent {
  constructor(private api: ApiService, private navController: NavController, private route: ActivatedRoute) {}
  async createGroup(form: NgForm) {
    if (form.invalid) return;

    const groupData = form.value;

    const group = await this.api.members.createGroup(groupData).then((res) => res.data);

    this.navController.navigateForward(["..", group.id], { relativeTo: this.route, replaceUrl: true });
  }
}
