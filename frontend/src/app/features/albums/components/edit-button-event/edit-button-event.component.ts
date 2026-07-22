import { Component, input, output } from "@angular/core";
import { ModalService } from "src/app/core/services/modal.service";
import { EditButtonComponent } from "src/app/shared/components/edit-button/edit-button.component";
import { SDK } from "src/sdk";
import { EventSelectorModalComponent } from "../event-selector-modal/event-selector-modal.component";

@Component({
	selector: "bo-edit-button-event",
	imports: [EditButtonComponent],
	templateUrl: "./edit-button-event.component.html",
})
export class EditButtonEventComponent {
	label = input<string | undefined>();
	disabled = input<boolean | undefined>();

	update = output<SDK.EventResponseWithLinks["id"]>();

	constructor(private readonly modalService: ModalService) {}

	async openEdit() {
		const event = await this.modalService.componentModal(EventSelectorModalComponent, undefined, {
			cssClass: "dialog-list",
		});

		if (event) this.update.emit(event.id);
	}
}
