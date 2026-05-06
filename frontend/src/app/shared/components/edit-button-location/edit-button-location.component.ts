import { Component, input, output } from "@angular/core";
import { ModalService } from "src/app/core/services/modal.service";
import { EditButtonComponent } from "../edit-button/edit-button.component";
import { LocationData, LocationEditModalComponent } from "../location-edit-modal/location-edit-modal.component";

@Component({
	selector: "bo-edit-button-location",
	imports: [EditButtonComponent],
	templateUrl: "./edit-button-location.component.html",
	styleUrl: "./edit-button-location.component.scss",
})
export class EditButtonLocationComponent {
	label = input<string | undefined>();
	place = input<string | null | undefined>();
	placeCoordinates = input<{ lat: number; lng: number } | null | undefined>();
	disabled = input<boolean | undefined>();

	update = output<LocationData>();

	constructor(private readonly modalService: ModalService) {}

	async openEdit() {
		const result = await this.modalService.componentModal(LocationEditModalComponent, {
			header: this.label(),
			data: {
				place: this.place() || null,
				placeCoordinates: this.placeCoordinates() || null,
			},
		});

		if (result) {
			this.update.emit(result);
		}
	}
}
