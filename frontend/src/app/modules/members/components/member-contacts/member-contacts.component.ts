import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { AlertController } from "@ionic/angular";
import { UntilDestroy } from "@ngneat/until-destroy";
import { MemberContactResponseWithLinks, MemberResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { MemberStoreService } from "../../services/member-store.service";

@UntilDestroy()
@Component({
  selector: "bo-member-contacts",
  templateUrl: "./member-contacts.component.html",
  styleUrls: ["./member-contacts.component.scss"],
})
export default class MemberContactsComponent implements OnChanges {
  @Input() member?: MemberResponseWithLinks | null;
  @Output() update = new EventEmitter<Partial<MemberResponseWithLinks>>();

  contacts?: MemberContactResponseWithLinks[];

  constructor(
    private toastService: ToastService,
    private api: ApiService,
    private memberStore: MemberStoreService,
    private alertController: AlertController,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["member"]) this.loadContacts(this.member);
  }

  async loadContacts(member?: MemberResponseWithLinks | null) {
    if (!member) {
      this.contacts = [];
    } else {
      this.contacts = await this.api.members.listContacts(member.id).then((res) => res.data);
    }
  }

  async copyContact(contact: string) {
    await navigator.clipboard.writeText(contact);
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
    if (!this.memberStore.currentMember.value) return;
    const memberId = this.memberStore.currentMember.value.id;

    await this.api.members.createContact(memberId, {
      title: data.title,
      email: data.email,
      mobile: data.mobile,
      other: data.other,
    });

    await this.loadContacts(this.memberStore.currentMember.value);

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
    if (!this.memberStore.currentMember.value) return;
    const memberId = this.memberStore.currentMember.value.id;

    await this.api.members.deleteContact(memberId, contact.id);

    await this.loadContacts(this.memberStore.currentMember.value);

    await this.toastService.toast("Kontakt byl smazán");
  }
}
