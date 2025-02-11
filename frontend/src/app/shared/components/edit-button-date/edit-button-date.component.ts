import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ModalService } from "src/app/services/modal.service";

@Component({
	selector: "bo-edit-button-date",
	standalone: false,
	templateUrl: "./edit-button-date.component.html",
	styleUrl: "./edit-button-date.component.scss",
})
export class EditButtonDateComponent {
	@Input() label?: string;
	@Input() value?: string | null;
	@Input() disabled?: boolean;

	@Output() update = new EventEmitter<string | null>();

	constructor(private readonly modalService: ModalService) {}

	async openEdit() {
		const result = await this.modalService.inputModal({
			header: this.label,
			inputs: {
				date: {
					placeholder: "Datum",
					type: "date",
					value: this.value,
				},
			},
		});

		if (result) this.update.emit(result.date);
	}
}
