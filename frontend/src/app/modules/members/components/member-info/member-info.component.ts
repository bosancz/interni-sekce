import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { MemberResponse, MemberResponseWithLinks, MemberRolesEnum, MembershipStatesEnum } from "src/app/api";
import { MemberRoles } from "src/app/config/member-roles";
import { MembershipStates } from "src/app/config/membership-states";
import { ApiService } from "src/app/services/api.service";
import { ModalService } from "src/app/services/modal.service";

@UntilDestroy()
@Component({
    selector: "bo-member-info",
    templateUrl: "./member-info.component.html",
    styleUrls: ["./member-info.component.scss"],
    standalone: false
})
export class MemberInfoComponent implements OnInit {
  @Input() member?: MemberResponseWithLinks | null;
  @Output() update = new EventEmitter<Partial<MemberResponse>>();

  constructor(
    private api: ApiService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {}

  async editName() {
    const data = await this.modalService.inputModal({
      header: "Upravit jméno",
      inputs: {
        firstName: { placeholder: "Jméno", value: this.member?.firstName },
        lastName: { placeholder: "Příjmení", value: this.member?.lastName },
      },
    });

    if (data !== null) this.update.emit(data);
  }

  async editNickname() {
    const data = await this.modalService.inputModal({
      header: "Upravit přezdívku",
      inputs: {
        nickname: { placeholder: "Přezdívka", value: this.member?.nickname },
      },
    });

    if (data !== null) this.update.emit(data);
  }

  async editBirthday() {
    const data = await this.modalService.inputModal({
      header: "Upravit datum narození",
      inputs: {
        birthday: { type: "date", placeholder: "Datum narození", value: this.member?.birthday },
      },
    });

    if (data !== null) this.update.emit(data);
  }

  async editMobile() {
    const data = await this.modalService.inputModal({
      header: "Upravit telefonní číslo",
      inputs: {
        mobile: { type: "tel", placeholder: "Telefonní číslo", value: this.member?.mobile },
      },
    });

    if (data !== null) this.update.emit(data);
  }

  async editEmail() {
    const data = await this.modalService.inputModal({
      header: "Upravit email",
      inputs: {
        email: { type: "email", placeholder: "Email", value: this.member?.email },
      },
    });

    if (data !== null) this.update.emit(data);
  }

  async editAddress() {
    const data = await this.modalService.inputModal({
      header: "Upravit adresu",
      inputs: {
        addressStreet: {
          type: "text",
          placeholder: "Ulice",
          value: this.member?.addressStreet,
        },
        addressStreetNo: {
          type: "text",
          placeholder: "Číslo popisné",
          value: this.member?.addressStreetNo,
        },
        addressCity: {
          type: "text",
          placeholder: "Město",
          value: this.member?.addressCity,
        },
        addressPostalCode: {
          type: "text",
          placeholder: "PSČ",
          value: this.member?.addressPostalCode,
        },
        addressCountry: {
          type: "text",
          placeholder: "Země",
          value: this.member?.addressCountry,
        },
      },
    });

    if (data) this.update.emit(data);
  }

  getFullAddress(member: MemberResponseWithLinks) {
    const addressLines = [
      `${member.addressStreet ?? ""}${member.addressStreetNo ? ` ${member.addressStreetNo}` : ""}`,
      member.addressCity,
      member.addressPostalCode,
    ];

    if (member.addressCountry) {
      addressLines.push(member.addressCountry);
    }
    return addressLines.filter((line) => !!line).join("\n");
  }

  async editActivity() {
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

  async editRole() {
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

  async editGroup() {
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

  async editMembership() {
    const result = await this.modalService.selectModal({
      header: "Změnit aktivitu",
      buttonText: "Uložit",
      values: Object.entries(MembershipStates).map(([id, role]) => ({
        label: role.title,
        value: id as MembershipStatesEnum,
        checked: this.member?.role === id,
      })),
      value: this.member?.membership,
    });

    if (result !== null) this.update.emit({ membership: result });
  }
}
