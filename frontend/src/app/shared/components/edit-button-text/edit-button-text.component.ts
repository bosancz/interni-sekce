import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ModalService } from "src/app/services/modal.service";

@Component({
	selector: "bo-edit-button-text",
	standalone: false,
	templateUrl: "./edit-button-text.component.html",
	styleUrl: "./edit-button-text.component.scss",
})
export class EditButtonTextComponent {
	@Input() type?: "text" | "email" | "password" | "tel" | "url" = "text";
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
					type: this.type,
					value: this.value,
				},
			},
		});

		if (result) this.update.emit(result.value ?? null);
	}
}
