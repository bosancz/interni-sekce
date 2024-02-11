import { Component, Input, TemplateRef } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { AbstractModalComponent } from "src/app/services/modal.service";

@Component({
  selector: "bo-filter-modal",
  templateUrl: "./filter-modal.component.html",
  styleUrl: "./filter-modal.component.scss",
})
export class FilterModalComponent extends AbstractModalComponent<boolean> {
  @Input() content!: TemplateRef<any>;

  constructor(modalCtrl: ModalController) {
    super(modalCtrl);
  }
}
