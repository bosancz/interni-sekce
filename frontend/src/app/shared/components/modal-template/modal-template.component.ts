import { Component, Input, TemplateRef } from "@angular/core";

@Component({
	selector: "bo-modal-template",
	templateUrl: "./modal-template.component.html",
	styleUrl: "./modal-template.component.scss",
	standalone: false,
})
export class ModalTemplateComponent {
	@Input() template!: TemplateRef<any>;
}
