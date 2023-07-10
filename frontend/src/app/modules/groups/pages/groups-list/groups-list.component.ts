import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import {
  ActionSheetButton,
  ActionSheetController,
  AlertController,
  NavController,
  ViewWillEnter,
} from "@ionic/angular";
import { GroupResponse } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@Component({
  selector: "bo-groups-list",
  templateUrl: "./groups-list.component.html",
  styleUrls: ["./groups-list.component.scss"],
})
export class GroupsListComponent implements ViewWillEnter {
  groups?: GroupResponse[];

  actions: Action[] = [
    {
      text: "Přidat",
      icon: "add-outline",
      pinned: true,
      handler: () => this.navController.navigateForward(["vytvorit"], { relativeTo: this.route }),
    },
  ];

  constructor(
    private api: ApiService,
    private navController: NavController,
    private route: ActivatedRoute,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private toastService: ToastService,
  ) {}

  ionViewWillEnter(): void {
    this.loadGroups();
  }

  private async loadGroups() {
    this.groups = await this.api.members.listGroups().then((res) => res.data);
  }

  async openGroupMenu(group: GroupResponse) {
    const buttons: ActionSheetButton[] = [];

    if (group._links.updateGroup.allowed) {
      buttons.push({
        text: "Upravit",
        icon: "create-outline",
        handler: () => this.navController.navigateForward([group.id], { relativeTo: this.route }),
      });
    }

    if (group._links.deleteGroup.allowed) {
      buttons.push({
        text: "Smazat",
        role: "destructive",
        icon: "trash-outline",
        handler: () => this.deleteGroup(group),
      });
    }

    const sheet = await this.actionSheetController.create({
      header: group.name ?? group.shortName ?? `Oddíl ${group.id}`,
      buttons,
    });

    sheet.present();
  }

  private async deleteGroup(group: GroupResponse) {
    const alert = await this.alertController.create({
      header: `Smazat ${group.name ?? group.id}?`,
      buttons: [
        {
          text: "Zrušit",
          role: "cancel",
        },
        {
          text: "Smazat",
          role: "destructive",
          handler: async () => this.deleteGroupConfirmed(group),
        },
      ],
    });

    alert.present();
  }

  private async deleteGroupConfirmed(group: GroupResponse) {
    await this.api.members.deleteGroup(group.id);

    await this.loadGroups();

    await this.toastService.toast(`${group.name ?? "Oddíl " + group.id} smazán.`);
  }
}
