import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ModalService } from "src/app/services/modal.service";

@Component({
	selector: "bo-edit-button-date-range",
	standalone: false,
	templateUrl: "./edit-button-date-range.component.html",
	styleUrl: "./edit-button-date-range.component.scss",
})
export class EditButtonDateRangeComponent {
	@Input() label?: string;
	@Input() value?: [string | undefined, string | undefined];
	@Input() disabled?: boolean;

	@Output() update = new EventEmitter<[string, string]>();

	constructor(private readonly modalService: ModalService) {}

	async openEdit() {
		const result = await this.modalService.inputModal({
			header: this.label,
			inputs: {
				dateFrom: {
					placeholder: "Datum od",
					type: "date",
					value: this.value?.[0],
				},
				dateTill: {
					placeholder: "Datum do",
					type: "date",
					value: this.value?.[1],
				},
			},
		});

		if (result) this.update.emit([result.dateFrom, result.dateTill]);
	}
}
