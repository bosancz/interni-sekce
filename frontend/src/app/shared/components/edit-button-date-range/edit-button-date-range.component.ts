import { Component, input, output } from "@angular/core";
import { ModalService } from "src/app/core/services/modal.service";
import { EditButtonComponent } from "../edit-button/edit-button.component";

@Component({
	selector: "bo-edit-button-date-range",

	imports: [EditButtonComponent],
	templateUrl: "./edit-button-date-range.component.html",
	styleUrl: "./edit-button-date-range.component.scss",
})
export class EditButtonDateRangeComponent {
	label = input<string | undefined>();
	value = input<[string | undefined, string | undefined] | undefined>();
	disabled = input<boolean | undefined>();

	update = output<[string, string]>();

	constructor(private readonly modalService: ModalService) {}

	async openEdit() {
		const value = this.value();
		const result = await this.modalService.inputModal({
			header: this.label(),
			inputs: {
				dateFrom: {
					placeholder: "Datum od",
					type: "date",
					value: value?.[0],
				},
				dateTill: {
					placeholder: "Datum do",
					type: "date",
					value: value?.[1],
				},
			},
		});

		if (result) this.update.emit([result.dateFrom, result.dateTill]);
	}
}
