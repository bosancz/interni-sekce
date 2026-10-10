import { CommonModule } from "@angular/common";
import { Component, computed, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IonList } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EventTypeSelectorComponent } from "src/app/features/events/components/event-type-selector/event-type-selector.component";
import { RiverSelectModalComponent } from "src/app/features/events/components/river-select-modal/river-select-modal.component";
import { ModalService } from "src/app/core/services/modal.service";
import { EditButtonComponent } from "src/app/shared/components/edit-button/edit-button.component";
import { EditButtonDateRangeComponent } from "src/app/shared/components/edit-button-date-range/edit-button-date-range.component";
import { EditButtonLocationComponent } from "src/app/shared/components/edit-button-location/edit-button-location.component";
import { EditButtonMarkdownComponent } from "src/app/shared/components/edit-button-markdown/edit-button-markdown.component";
import { EditButtonNumberComponent } from "src/app/shared/components/edit-button-number/edit-button-number.component";
import { EditButtonTextComponent } from "src/app/shared/components/edit-button-text/edit-button-text.component";
import { EventCardComponent } from "src/app/shared/components/event-card/event-card.component";
import { GroupsSelectComponent } from "src/app/shared/components/groups-select/groups-select.component";
import { ItemComponent } from "src/app/shared/components/item/item.component";
import { LocationMapComponent } from "src/app/shared/components/location-map/location-map.component";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { SDK } from "src/sdk";
import { MarkdownPipe } from "../../../../shared/pipes/markdown.pipe";
import { EventRegistrationComponent } from "../event-registration/event-registration.component";

@UntilDestroy()
@Component({
	selector: "bo-event-info",
	templateUrl: "./event-info.component.html",
	styleUrls: ["./event-info.component.scss"],

	imports: [
		CommonModule,
		FormsModule,
		IonList,
		ItemComponent,
		EditButtonComponent,
		EditButtonTextComponent,
		EditButtonNumberComponent,
		EditButtonDateRangeComponent,
		EditButtonMarkdownComponent,
		EditButtonLocationComponent,
		GroupsSelectComponent,
		EventTypeSelectorComponent,
		DateRangePipe,
		MarkdownPipe,
		EventRegistrationComponent,
		EventCardComponent,
		LocationMapComponent,
	],
})
export class EventInfoComponent {
	event = input<SDK.EventResponseWithLinks | undefined>(undefined);
	update = output<SDK.EventUpdateBody>();

	private modalService = inject(ModalService);

	canEdit = computed(() => this.event()?._links?.updateEvent?.allowed ?? false);

	placeCoordinates = computed(() => {
		const geom = this.event()?.placeGeometry;
		if (!geom) return null;
		return { lat: geom.coordinates[1], lng: geom.coordinates[0] };
	});

	async editRiver() {
		const result = await this.modalService.componentModal(
			RiverSelectModalComponent,
			{ value: this.event()?.river ?? null },
			{ cssClass: "dialog-picker" },
		);
		if (result) this.update.emit({ river: result.river });
	}
}
