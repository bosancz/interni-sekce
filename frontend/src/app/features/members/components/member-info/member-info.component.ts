import { DatePipe } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { personOutline } from "ionicons/icons";
import { SDK } from "src/sdk";
import { CardContentComponent } from "../../../../shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "../../../../shared/components/card-header/card-header.component";
import { CardTitleComponent } from "../../../../shared/components/card-title/card-title.component";
import { CardComponent } from "../../../../shared/components/card/card.component";
import { EditButtonDateComponent } from "../../../../shared/components/edit-button-date/edit-button-date.component";
import { EditButtonNameComponent } from "../../../../shared/components/edit-button-name/edit-button-name.component";
import { EditButtonTextComponent } from "../../../../shared/components/edit-button-text/edit-button-text.component";

@UntilDestroy()
@Component({
	selector: "bo-member-info",
	templateUrl: "./member-info.component.html",
	styleUrls: ["./member-info.component.scss"],
	imports: [
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		IonIcon,
		IonSkeletonText,
		DatePipe,
		EditButtonNameComponent,
		EditButtonTextComponent,
		EditButtonDateComponent,
	],
})
export class MemberInfoComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
	update = output<Partial<SDK.MemberResponse>>();

	constructor() {
		addIcons({ personOutline });
	}
}
