import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { AlertController } from "@ionic/angular";
import { UntilDestroy } from "@ngneat/until-destroy";
import { MemberResponseWithLinks } from "src/app/api";
@UntilDestroy()
@Component({
  selector: "bo-member-health",
  templateUrl: "./member-health.component.html",
  styleUrls: ["./member-health.component.scss"],
})
export class MemberHealthComponent implements OnInit {
  @Input() member?: MemberResponseWithLinks | null;
  @Output() update = new EventEmitter<Partial<MemberResponseWithLinks>>();

  constructor(private alertController: AlertController) {}

  ngOnInit(): void {}

  async openEditAllergies() {
    const alert = await this.alertController.create({
      header: "Upravit alergie",
      inputs: [
        {
          name: "allergies",
          type: "textarea",
          placeholder: "Seznam alergenů a jejich závažnost",
          value: this.member?.allergies,
        },
      ],
      buttons: [
        {
          text: "Zrušit",
          role: "cancel",
        },
        {
          text: "Uložit",
          handler: async (data) => this.update.emit({ allergies: data.allergies }),
        },
      ],
    });

    await alert.present();
  }
}
