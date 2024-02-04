import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { AlertController } from "@ionic/angular";
import { UntilDestroy } from "@ngneat/until-destroy";
import { MemberResponse, MemberResponseWithLinks, MemberRolesEnum } from "src/app/api";
import { MemberRoles } from "src/app/config/member-roles";
import { ApiService } from "src/app/services/api.service";
import { ModalService } from "src/app/services/modal.service";

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
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {}

  async openBasicInfoForm() {
    const data = await this.modalService.inputModal({
      header: "Upravit základní informace",
      inputs: {
        firstName: { placeholder: "Jméno", value: this.member?.firstName },
        lastName: { placeholder: "Příjmení", value: this.member?.lastName },
        nickname: { placeholder: "Přezdívka", value: this.member?.nickname },
        birthday: { type: "date", placeholder: "Datum narození", value: this.member?.birthday },
      },
    });

    if (data !== null) this.update.emit(data);
  }

  async openMembershipChangeForm() {
    const result = await this.modalService.selectModal({
      header: "Změnit aktivitu",
      buttonText: "Uložit",
      values: [
        { label: "Aktivní", value: true },
        { label: "Neaktivní", value: false },
      ],
      value: this.member?.active,
    });

    if (result !== null) this.update.emit({ active: result });
  }

  async openRoleChangeForm() {
    const role = await this.modalService.selectModal<MemberRolesEnum>({
      header: "Změnit roli",
      buttonText: "Uložit",
      values: Object.entries(MemberRoles).map(([id, role]) => ({
        label: role.title,
        value: id as MemberRolesEnum,
        checked: this.member?.role === id,
      })),
      value: this.member?.role,
    });

    if (role !== null) this.update.emit({ role });
  }

  async openGroupChangeForm() {
    const groups = await this.api.members.listGroups({ active: true }).then((res) => res.data);
    groups.sort((a, b) => a.shortName.localeCompare(b.shortName, "cs", { numeric: true }));

    const group = await this.modalService.selectModal({
      header: "Změnit skupinu",
      buttonText: "Uložit",
      values: groups.map((g) => ({ label: g.name ?? g.shortName, value: g.id })),
      value: this.member?.groupId,
    });

    if (group !== null) this.update.emit({ groupId: group });
  }
}
