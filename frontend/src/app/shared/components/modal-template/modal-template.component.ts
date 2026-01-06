import { NgTemplateOutlet } from "@angular/common";
import { Component, input, TemplateRef } from "@angular/core";

@Component({
	selector: "bo-modal-template",
	templateUrl: "./modal-template.component.html",
	styleUrl: "./modal-template.component.scss",
	
	imports: [NgTemplateOutlet],
})
export class ModalTemplateComponent {
	template = input.required<TemplateRef<any>>();
}
