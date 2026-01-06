import { Component, EventEmitter, Input, Output, TemplateRef } from "@angular/core";
import { ModalService } from "src/app/services/modal.service";

@Component({
	selector: "bo-edit-button-markdown",
	standalone: false,
	templateUrl: "./edit-button-markdown.component.html",
	styleUrl: "./edit-button-markdown.component.scss",
})
export class EditButtonMarkdownComponent {
	@Input() label?: string;
	@Input() placeholder?: string;
	@Input() value?: string | null;
	@Input() disabled?: boolean;

	@Output() update = new EventEmitter<string | null>();

	constructor(private readonly modalService: ModalService) {}

	async openEdit(template: TemplateRef<any>) {
		const result = await this.modalService.templateModal(template);

		// if (result) this.update.emit(result.value ?? null);
	}
}
