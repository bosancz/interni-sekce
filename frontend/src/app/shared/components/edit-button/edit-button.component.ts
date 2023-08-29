import { Component, EventEmitter, Input, Output } from "@angular/core";
import { AlertController, AlertInput } from "@ionic/angular";

type EditTypes = "alert" | "member" | "markdown";
type EditInputs = { [key: string]: AlertInput["type"] };

@Component({
  selector: "bo-edit-button",
  templateUrl: "./edit-button.component.html",
  styleUrls: ["./edit-button.component.scss"],
})
export class EditButtonComponent {
  @Input() type: EditTypes = "alert";
  @Input() inputs!: EditInputs;
  @Input() value?: any;
  @Input() disabled = false;

  @Output() change = new EventEmitter();

  constructor(private alertController: AlertController) {}

  onClick() {
    switch (this.type) {
      case "alert":
        return this.openEditAlert();
    }
  }

  async openEditAlert() {
    const alert = await this.alertController.create({
      header: "Edit",
      inputs: Object.entries(this.inputs).map(([name, type]) => ({
        name,
        type,
        value: this.value?.[name],
      })),
      buttons: [
        {
          text: "Cancel",
          role: "cancel",
        },
        {
          text: "Save",
          handler: (data) => this.change.emit(data),
        },
      ],
    });

    alert.present();
  }
}
