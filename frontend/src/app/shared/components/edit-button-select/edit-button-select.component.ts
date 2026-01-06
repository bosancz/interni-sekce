import { Component, input, output } from "@angular/core";
import { ModalService } from "src/app/core/services/modal.service";
import { EditButtonComponent } from "../edit-button/edit-button.component";

@Component({
	selector: "bo-edit-button-select",

	imports: [EditButtonComponent],
	templateUrl: "./edit-button-select.component.html",
	styleUrl: "./edit-button-select.component.scss",
})
export class EditButtonSelectComponent<R extends boolean> {
	label = input<string | undefined>();
	values = input.required<{ label: string; value: string }[]>();
	value = input<string | undefined>();
	disabled = input<boolean | undefined>();
	required = input<R | undefined>();

	update = output<R extends true ? string : string | null>();

	constructor(private readonly modalService: ModalService) {}

	async openEdit() {
		const result = await this.modalService.selectModal({
			header: this.label(),
			values: this.values(),
			value: this.value(),
		});

		if (result || !this.required()) this.update.emit(result as string);
	}
}
