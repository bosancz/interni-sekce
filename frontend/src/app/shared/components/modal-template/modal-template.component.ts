import { Component, Input, TemplateRef } from "@angular/core";

@Component({
  selector: "bo-modal-template",
  templateUrl: "./modal-template.component.html",
  styleUrl: "./modal-template.component.scss",
})
export class ModalTemplateComponent {
  @Input() template!: TemplateRef<any>;
}
