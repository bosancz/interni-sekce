import { Component, input, output } from "@angular/core";
import { ModalService } from "src/app/core/services/modal.service";
import { EditButtonComponent } from "../edit-button/edit-button.component";

@Component({
	selector: "bo-edit-button-name",

	imports: [EditButtonComponent],
	templateUrl: "./edit-button-name.component.html",
	styleUrl: "./edit-button-name.component.scss",
})
export class EditButtonNameComponent {
	label = input<string | undefined>();
	placeholder = input<string | undefined>();
	value = input<{ firstName?: string | null; lastName?: string | null } | undefined>();
	disabled = input<boolean | undefined>();

	update = output<{ firstName?: string; lastName?: string }>();

	constructor(private readonly modalService: ModalService) {}

	async openEdit() {
		const value = this.value();
		const result = await this.modalService.inputModal({
			header: this.label(),
			inputs: {
				firstName: {
					placeholder: this.placeholder(),
					type: "text",
					value: value?.firstName,
				},
				lastName: {
					placeholder: this.placeholder(),
					type: "text",
					value: value?.lastName,
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
