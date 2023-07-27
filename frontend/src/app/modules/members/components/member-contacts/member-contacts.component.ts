import { Component } from "@angular/core";
import { ToastService } from "src/app/services/toast.service";

@Component({
  selector: "bo-member-contacts",
  templateUrl: "./member-contacts.component.html",
  styleUrls: ["./member-contacts.component.scss"],
})
export class MemberContactsComponent {
  contacts = [
    { label: "Matka", type: "mobile", value: "+420 123 456 789" },
    { label: "Otec", type: "mobile", value: "+420 123 456 789" },
    { label: "Bratr", type: "email", value: "bratr@email.cz" },
  ];

  constructor(private toastService: ToastService) {}

  async copyContact(contact: string) {
    await navigator.clipboard.writeText(contact);
    await this.toastService.toast("Kontakt byl zkopírován do schránky");
  }
}
