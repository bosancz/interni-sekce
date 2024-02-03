import { AfterViewInit, Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { AlertInput, IonModal, ModalController, Platform } from "@ionic/angular";

type EditTypes = "alert" | "member" | "markdown";
type EditInputs = { [key: string]: AlertInput["type"] };

@Component({
  selector: "bo-edit-button",
  templateUrl: "./edit-button.component.html",
  styleUrls: ["./edit-button.component.scss"],
})
export class EditButtonComponent implements AfterViewInit {
  @Input() type: EditTypes = "alert";
  @Input() inputs!: EditInputs;
  @Input() value?: any;
  @Input() disabled = false;

  @Output() change = new EventEmitter();

  @ViewChild(IonModal) modal!: IonModal;

  constructor(
    private modalController: ModalController,
    private platform: Platform,
  ) {}

  ngAfterViewInit(): void {
    // this.modal.backdropDismiss = false;
  }
  open() {
    this.modal.present();
  }

  close() {
    this.modal.dismiss();
  }

  onModalWillDismiss(event: Event) {}

  // async openEditAlert() {
  //   const alert = await this.alertController.create({
  //     header: "Edit",
  //     inputs: Object.entries(this.inputs).map(([name, type]) => ({
  //       name,
  //       type,
  //       value: this.value?.[name],
  //     })),
  //     buttons: [
  //       {
  //         text: "Cancel",
  //         role: "cancel",
  //       },
  //       {
  //         text: "Save",
  //         handler: (data) => this.change.emit(data),
  //       },
  //     ],
  //   });

  //   alert.present();
  // }
}
