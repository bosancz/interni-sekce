import { Component, EventEmitter, Input, Output } from "@angular/core";
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

	async openEdit() {
		const result = await this.modalService.inputModal({
			header: this.label,
			inputs: {
				value: {
					placeholder: this.placeholder,
					type: "textarea",
					value: this.value,
				},
			},
		});

		if (result) this.update.emit(result.value ?? null);
	}
}
