import { Component, input, output } from "@angular/core";
import { ModalService } from "src/app/core/services/modal.service";
import { EditButtonComponent } from "../edit-button/edit-button.component";

@Component({
	selector: "bo-edit-button-number",

	imports: [EditButtonComponent],
	templateUrl: "./edit-button-number.component.html",
})
export class EditButtonNumberComponent {
	label = input<string | undefined>();
	placeholder = input<string | undefined>();
	value = input<number | null | undefined>();
	disabled = input<boolean | undefined>();

	update = output<number | null>();

	constructor(private readonly modalService: ModalService) {}

	async openEdit() {
		const result = await this.modalService.inputModal({
			header: this.label(),
			inputs: {
				value: {
					placeholder: this.placeholder(),
					type: "number",
					value: this.value() ?? undefined,
				},
			},
		});

		if (!result) return;

		const raw = result.value;
		this.update.emit(raw === null || raw === undefined || `${raw}`.trim() === "" ? null : Number(raw));
	}
}
