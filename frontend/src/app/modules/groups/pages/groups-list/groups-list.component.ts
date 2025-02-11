import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ActionSheetController, AlertController, NavController, ViewWillEnter } from "@ionic/angular";
import { GroupResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@Component({
    selector: "bo-groups-list",
    templateUrl: "./groups-list.component.html",
    styleUrls: ["./groups-list.component.scss"],
    standalone: false
})
export class GroupsListComponent implements ViewWillEnter {
  groups?: GroupResponseWithLinks[];

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
    this.groups.sort((a, b) =>
      (a.name ?? a.shortName).localeCompare(b.name ?? b.shortName, undefined, { numeric: true }),
    );
  }

  async deleteGroup(group: GroupResponseWithLinks) {
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

  private async deleteGroupConfirmed(group: GroupResponseWithLinks) {
    await this.api.members.deleteGroup(group.id);

    await this.loadGroups();

    await this.toastService.toast(`${group.name ?? "Oddíl " + group.id} smazán.`);
  }
}
