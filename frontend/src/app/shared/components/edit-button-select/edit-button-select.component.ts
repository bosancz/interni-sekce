import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ModalService } from "src/app/services/modal.service";

@Component({
	selector: "bo-edit-button-select",
	standalone: false,
	templateUrl: "./edit-button-select.component.html",
	styleUrl: "./edit-button-select.component.scss",
})
export class EditButtonSelectComponent<R extends boolean> {
	@Input() label?: string;

	@Input() values!: { label: string; value: string }[];
	@Input() value?: string;
	@Input() disabled?: boolean;
	@Input() required?: R;

	@Output() update = new EventEmitter<R extends true ? string : string | null>();

	constructor(private readonly modalService: ModalService) {}

	async openEdit() {
		const result = await this.modalService.selectModal({
			header: this.label,
			values: this.values,
			value: this.value,
		});

		if (result || !this.required) this.update.emit(result as string);
	}
}
