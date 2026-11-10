import { CommonModule } from "@angular/common";
import { Component, computed, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IonButton, IonIcon, IonList } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { add } from "ionicons/icons";
import { UntilDestroy } from "@ngneat/until-destroy";
import { ModalService } from "src/app/core/services/modal.service";
import { EventTypeSelectorComponent } from "src/app/features/events/components/event-type-selector/event-type-selector.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardFooterComponent } from "src/app/shared/components/card-footer/card-footer.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
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
import { MarkdownInlinePipe, MarkdownPipe } from "../../../../shared/pipes/markdown.pipe";
import { TypographyPipe } from "../../../../shared/pipes/typography.pipe";
import { EventLeadersComponent } from "../event-leaders/event-leaders.component";
import { EventRegistrationComponent } from "../event-registration/event-registration.component";
import { RiverSelectModalComponent } from "../river-select-modal/river-select-modal.component";

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
		IonButton,
		IonIcon,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		CardFooterComponent,
		EditButtonComponent,
		EditButtonTextComponent,
		EventLeadersComponent,
		EditButtonNumberComponent,
		EditButtonDateRangeComponent,
		EditButtonMarkdownComponent,
		EditButtonLocationComponent,
		GroupsSelectComponent,
		EventTypeSelectorComponent,
		DateRangePipe,
		MarkdownPipe,
		MarkdownInlinePipe,
		TypographyPipe,
		EventRegistrationComponent,
		EventCardComponent,
		LocationMapComponent,
	],
})
export class EventInfoComponent {
	event = input<SDK.EventResponseWithLinks | undefined>(undefined);
	update = output<SDK.EventUpdateBody>();
	change = output<void>();

	private readonly modalService = inject(ModalService);

	constructor() {
		addIcons({ add });
	}

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
