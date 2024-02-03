import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { AlertButton, AlertController } from "@ionic/angular";
import { UntilDestroy } from "@ngneat/until-destroy";
import { MemberContactResponseWithLinks, MemberResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";

@UntilDestroy()
@Component({
  selector: "bo-member-contacts",
  templateUrl: "./member-contacts.component.html",
  styleUrls: ["./member-contacts.component.scss"],
})
export default class MemberContactsComponent implements OnChanges {
  @Input() member?: MemberResponseWithLinks | null;
  @Output() change = new EventEmitter<Partial<MemberResponseWithLinks>>();

  contacts?: MemberContactResponseWithLinks[];

  constructor(
    private toastService: ToastService,
    private api: ApiService,
    private alertController: AlertController,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["member"]) this.loadContacts(this.member?.id ?? null);
  }

  async loadContacts(memberId: number | null) {
    if (!memberId) {
      this.contacts = [];
    } else {
      this.contacts = await this.api.members.listContacts(memberId).then((res) => res.data);
    }
  }

  async openContactForm(contact: MemberContactResponseWithLinks | null) {
    const buttons: AlertButton[] = [
      {
        text: contact ? "Uložit" : "Přidat",
        handler: async (data) => {
          if (!data.title) {
            this.toastService.toast("Chybí název kontaktu", { color: "danger" });
            return false;
          } else if (!data.email && !data.mobile && !data.other) {
            this.toastService.toast("Musí být vyplněn alespoň jeden kontakt", { color: "danger" });
            return false;
          } else {
            await this.saveContact(contact?.id ?? null, data);
          }
        },
      },
    ];

    if (contact) {
      buttons.unshift({
        text: "Smazat",
        role: "destructive",
        handler: () => {
          alert.dismiss();
          if (contact) this.deleteContact(contact);
        },
      });
    } else {
      buttons.unshift({
        text: "Zrušit",
        role: "cancel",
      });
    }

    const alert = await this.alertController.create({
      header: contact ? "Upravit kontakt" : "Přidat kontakt",
      inputs: [
        {
          name: "title",
          type: "text",
          attributes: {
            required: true,
          },
          placeholder: "Název kontaktu",
          value: contact?.title,
        },
        {
          name: "email",
          type: "email",
          placeholder: "Email",
          value: contact?.email,
        },
        {
          name: "mobile",
          type: "tel",
          placeholder: "Mobil",
          value: contact?.mobile,
        },
        {
          name: "other",
          type: "text",
          placeholder: "Jiný",
          value: contact?.other,
        },
      ],
      buttons,
    });

    await alert.present();
  }

  private async saveContact(
    contactId: number | null,
    data: { title: string; email?: string; mobile?: string; other?: string },
  ) {
    if (!this.member) return;

    if (contactId) {
      await this.api.members.updateContact(this.member.id, contactId, data);
    } else {
      await this.api.members.createContact(this.member.id, data);
    }

    await this.loadContacts(this.member.id);

    this.change.emit();

    await this.toastService.toast(contactId ? "Kontakt byl upraven" : "Kontakt byl přidán");
  }

  async deleteContact(contact: MemberContactResponseWithLinks) {
    const alert = await this.alertController.create({
      header: "Smazat kontakt",
      message: `Opravdu chcete smazat kontakt ${contact.title}?`,
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
    if (!this.member) return;

    await this.api.members.deleteContact(this.member.id, contact.id);

    await this.loadContacts(this.member.id);

    this.change.emit();

    await this.toastService.toast("Kontakt byl smazán");
  }

  getFullAddress(member: MemberResponseWithLinks) {
    let address = `${member.addressStreet} ${member.addressStreetNo}\n${member.addressCity}\n${member.addressPostalCode}`;
    if (member.addressCountry) {
      address += `\n${member.addressCountry}`;
    }
    return address;
  }
}
