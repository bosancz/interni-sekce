import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ModalService } from "src/app/services/modal.service";

@Component({
	selector: "bo-edit-button-name",
	standalone: false,
	templateUrl: "./edit-button-name.component.html",
	styleUrl: "./edit-button-name.component.scss",
})
export class EditButtonNameComponent {
	@Input() label?: string;
	@Input() placeholder?: string;
	@Input() value?: { firstName?: string | null; lastName?: string | null };
	@Input() disabled?: boolean;

	@Output() update = new EventEmitter<{ firstName?: string; lastName?: string }>();

	constructor(private readonly modalService: ModalService) {}

	async openEdit() {
		const result = await this.modalService.inputModal({
			header: this.label,
			inputs: {
				firstName: {
					placeholder: this.placeholder,
					type: "text",
					value: this.value?.firstName,
				},
				lastName: {
					placeholder: this.placeholder,
					type: "text",
					value: this.value?.lastName,
				},
			},
		});

		if (result)
			this.update.emit({
				firstName: result.firstName || undefined,
				lastName: result.lastName || undefined,
			});
	}
}
