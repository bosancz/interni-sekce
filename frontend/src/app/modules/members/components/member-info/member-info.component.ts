import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { AlertController, AlertInput } from "@ionic/angular";
import { UntilDestroy } from "@ngneat/until-destroy";
import { MemberResponse, MemberResponseWithLinks } from "src/app/api";
import { MemberRoles } from "src/app/config/member-roles";
import { ApiService } from "src/app/services/api.service";

@UntilDestroy()
@Component({
  selector: "bo-member-info",
  templateUrl: "./member-info.component.html",
  styleUrls: ["./member-info.component.scss"],
})
export class MemberInfoComponent implements OnInit {
  @Input() member?: MemberResponseWithLinks | null;
  @Output() update = new EventEmitter<Partial<MemberResponse>>();

  constructor(
    private alertController: AlertController,
    private api: ApiService,
  ) {}

  ngOnInit(): void {}

  async openBasicInfoForm() {
    const alert = await this.alertController.create({
      header: "Upravit základní informace",
      inputs: [
        {
          name: "firstName",
          type: "text",
          placeholder: "Jméno",
          value: this.member?.firstName,
        },
        {
          name: "lastName",
          type: "text",
          placeholder: "Příjmení",
          value: this.member?.lastName,
        },
        {
          name: "nickname",
          type: "text",
          placeholder: "Přezdívka",
          value: this.member?.nickname,
        },
        {
          name: "phone",
          type: "date",
          placeholder: "Datum narození",
          value: this.member?.birthday,
        },
      ],
      buttons: [
        {
          text: "Zrušit",
          role: "cancel",
        },
        {
          text: "Uložit",
          handler: async (data) => this.update.emit(data),
        },
      ],
    });

    await alert.present();
  }

  async openMembershipChangeForm() {
    const alert = await this.alertController.create({
      header: "Změnit členství",
      inputs: [
        {
          name: "active",
          type: "radio",
          label: "Aktivní",
          value: true,
          checked: this.member?.active,
        },
        {
          name: "active",
          type: "radio",
          label: "Neaktivní",
          value: false,
          checked: !this.member?.active,
        },
      ],
      buttons: [
        {
          text: "Zrušit",
          role: "cancel",
        },
        {
          text: "Uložit",
          handler: async (data) => this.update.emit(data),
        },
      ],
    });

    await alert.present();
  }

  async openRoleChangeForm() {
    const alert = await this.alertController.create({
      header: "Změnit roli",
      inputs: Object.entries(MemberRoles).map(([id, role]) => ({
        name: "role",
        type: "radio",
        label: role.title,
        value: id,
        checked: this.member?.role === id,
      })),
      buttons: [
        {
          text: "Zrušit",
          role: "cancel",
        },
        {
          text: "Uložit",
          handler: async (data) => this.update.emit(data),
        },
      ],
    });

    await alert.present();
  }

  async openGroupChangeForm() {
    const groups = await this.api.members.listGroups({ active: true }).then((res) => res.data);
    groups.sort((a, b) => a.shortName.localeCompare(b.shortName, "cs", { numeric: true }));

    const inputs: AlertInput[] = groups.map((g) => ({
      name: "groupId",
      type: "radio",
      value: g.id,
      label: g.name,
      checked: this.member?.groupId === g.id,
    }));

    const alert = await this.alertController.create({
      header: "Změnit skupinu",
      inputs,
      buttons: [
        {
          text: "Zrušit",
          role: "cancel",
        },
        {
          text: "Uložit",
          handler: async (data) => this.update.emit({ groupId: data }),
        },
      ],
    });

    await alert.present();
  }
}
