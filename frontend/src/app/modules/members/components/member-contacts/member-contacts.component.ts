import { Component, OnInit } from "@angular/core";
import { AlertController } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MemberContactResponseWithLinks, MemberResponseWithLinks } from "src/app/api";
import { MemberContactTypes } from "src/app/config/member-contact-types";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { MembersService } from "../../services/members.service";

@UntilDestroy()
@Component({
  selector: "bo-member-contacts",
  templateUrl: "./member-contacts.component.html",
  styleUrls: ["./member-contacts.component.scss"],
})
export default class MemberContactsComponent implements OnInit {
  contacts?: MemberContactResponseWithLinks[];

  contactTypes = MemberContactTypes;

  constructor(
    private toastService: ToastService,
    private api: ApiService,
    private membersService: MembersService,
    private alertController: AlertController,
  ) {}

  ngOnInit(): void {
    this.membersService.currentMember.pipe(untilDestroyed(this)).subscribe((member) => this.loadContacts(member));
  }

  async loadContacts(member?: MemberResponseWithLinks | null) {
    if (!member) {
      this.contacts = [];
    } else {
      this.contacts = await this.api.members.listContacts(member.id).then((res) => res.data);
    }
  }

  async copyContact(contact: MemberContactResponseWithLinks) {
    await navigator.clipboard.writeText(contact.contact);
    await this.toastService.toast("Kontakt byl zkopírován do schránky");
  }

  async openAddContact() {
    const alert = await this.alertController.create({
      header: "Přidat kontakt",
      inputs: [
        {
          name: "title",
          type: "text",
          attributes: {
            required: true,
          },
          placeholder: "Název kontaktu",
        },
        {
          name: "email",
          type: "email",
          placeholder: "Email",
        },
        {
          name: "mobile",
          type: "tel",
          placeholder: "Mobil",
        },
        {
          name: "other",
          type: "text",
          placeholder: "Jiný",
        },
      ],
      buttons: [
        {
          text: "Zrušit",
          role: "cancel",
        },
        {
          text: "Přidat",
          handler: async (data) => {
            if (!data.title) {
              this.toastService.toast("Chybí název kontaktu", { color: "danger" });
              return false;
            } else if (!data.email && !data.mobile && !data.other) {
              this.toastService.toast("Musí být vyplněn alespoň jeden kontakt", { color: "danger" });
              return false;
            } else {
              await this.addContact(data);
            }
          },
        },
      ],
    });

    await alert.present();
  }

  private async addContact(data: { title: string; email?: string; mobile?: string; other?: string }) {
    if (!this.membersService.currentMember.value) return;
    const memberId = this.membersService.currentMember.value.id;

    if (data.email) {
      await this.api.members.createContact(memberId, {
        title: data.title,
        type: "email",
        contact: data.email,
      });
    }

    if (data.mobile) {
      await this.api.members.createContact(memberId, {
        title: data.title,
        type: "mobile",
        contact: data.mobile,
      });
    }

    if (data.other) {
      await this.api.members.createContact(memberId, {
        title: data.title,
        type: "other",
        contact: data.other,
      });
    }

    await this.loadContacts(this.membersService.currentMember.value);

    await this.toastService.toast("Kontakt byl přidán");
  }

  async deleteContact(contact: MemberContactResponseWithLinks) {
    const alert = await this.alertController.create({
      header: "Smazat kontakt",
      message: `Opravdu chcete smazat kontakt <strong>${contact.title}</strong>?`,
      buttons: [
        {
          text: "Zrušit",
          role: "cancel",
        },
        {
          text: "Smazat",
          handler: async () => {
            this.deleteContactConfirmed(contact);
          },
        },
      ],
    });

    await alert.present();
  }

  async deleteContactConfirmed(contact: MemberContactResponseWithLinks) {
    if (!this.membersService.currentMember.value) return;
    const memberId = this.membersService.currentMember.value.id;

    await this.api.members.deleteContact(memberId, contact.id);

    await this.loadContacts(this.membersService.currentMember.value);

    await this.toastService.toast("Kontakt byl smazán");
  }
}
