import { Component, input, output } from "@angular/core";
import { ModalService } from "src/app/core/services/modal.service";
import { EditButtonComponent } from "../edit-button/edit-button.component";
import { MarkdownEditorModalComponent } from "../markdown-editor-modal/markdown-editor-modal.component";

@Component({
	selector: "bo-edit-button-markdown",

	imports: [EditButtonComponent],
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

	async openEdit() {
		console.log("Opening MarkdownEditorModalComponent with value:", this.label());
		const result = await this.modalService.componentModal(MarkdownEditorModalComponent, {
			header: this.label(),
			value: this.value(),
			placeholder: this.placeholder(),
		});

		if (result !== null) this.update.emit(result);
	}
}
