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
		const result = await this.modalService.inputModal<{ dates: [string, string] }>({
			header: this.label(),
			inputs: {
				dates: {
					type: "date-range",
					value: [value?.[0], value?.[1]],
				},
			},
		});

		if (result) this.update.emit(result.dates);
	}
}
