import { Component, input, output, TemplateRef } from "@angular/core";
import { ModalService } from "src/app/core/services/modal.service";
import { EditButtonComponent } from "../edit-button/edit-button.component";
import { MarkdownEditorComponent } from "../markdown-editor/markdown-editor.component";

@Component({
	selector: "bo-edit-button-markdown",
	imports: [EditButtonComponent, MarkdownEditorComponent],
	templateUrl: "./edit-button-markdown.component.html",
	styleUrl: "./edit-button-markdown.component.scss",
})
export class EditButtonMarkdownComponent {
	label = input<string | undefined>();
	placeholder = input<string | undefined>();
	value = input<string | null | undefined>();
	disabled = input<boolean | undefined>();

	update = output<string | null>();

	constructor(private readonly modalService: ModalService) {}

	async openEdit(template: TemplateRef<any>) {
		const result = await this.modalService.templateModal(template);

		// if (result) this.update.emit(result.value ?? null);
	}
}
