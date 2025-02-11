import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { AlertController } from "@ionic/angular";
import { UntilDestroy } from "@ngneat/until-destroy";
import { MemberResponseWithLinks } from "src/app/api";
@UntilDestroy()
@Component({
    selector: "bo-member-health",
    templateUrl: "./member-health.component.html",
    styleUrls: ["./member-health.component.scss"],
    standalone: false
})
export class MemberHealthComponent implements OnInit {
  @Input() member?: MemberResponseWithLinks | null;
  @Output() update = new EventEmitter<Partial<MemberResponseWithLinks>>();

  constructor(private alertController: AlertController) {}

  ngOnInit(): void {}

  async openKnownProblemsForm() {
    const alert = await this.alertController.create({
      header: "Upravit známé problémy",
      inputs: [
        {
          name: "knownProblems",
          type: "textarea",
          placeholder: "Přehled známých zdravotních a jiných problémů",
          value: this.member?.knownProblems,
        },
      ],
      buttons: [
        {
          text: "Zrušit",
          role: "cancel",
        },
        {
          text: "Uložit",
          handler: async (data) => this.update.emit({ knownProblems: data.knownProblems }),
        },
      ],
    });

    await alert.present();
  }

  async openAllergiesForm() {
    const alert = await this.alertController.create({
      header: "Přidat alergii",
      inputs: [
        {
          name: "allergy",
          type: "text",
          placeholder: "Vyplň alergii a její závažnost",
        },
      ],
      buttons: [
        {
          text: "Zrušit",
          role: "cancel",
        },
        {
          text: "Uložit",
          handler: async (data) => this.update.emit({ allergies: [...(this.member!.allergies || []), data.allergy] }),
        },
      ],
    });

    await alert.present();
  }

  deleteAllergy(index: number) {
    this.update.emit({ allergies: this.member!.allergies!.filter((_, i) => i !== index) });
  }
}
