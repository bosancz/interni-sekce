import { Component, input, output } from "@angular/core";
import { IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { callOutline, mailOutline } from "ionicons/icons";
import { SDK } from "src/sdk";
import { CardContentComponent } from "../../../../shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "../../../../shared/components/card-header/card-header.component";
import { CardTitleComponent } from "../../../../shared/components/card-title/card-title.component";
import { CardComponent } from "../../../../shared/components/card/card.component";
import { EditButtonTextComponent } from "../../../../shared/components/edit-button-text/edit-button-text.component";
import { IconButtonComponent } from "../../../../shared/components/icon-button/icon-button.component";

@Component({
	selector: "bo-member-contact",

	imports: [
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		IonIcon,
		IonSkeletonText,
		IconButtonComponent,
		EditButtonTextComponent,
	],
	templateUrl: "./member-contact.component.html",
	styleUrl: "./member-contact.component.scss",
})
export class MemberContactComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
	update = output<Partial<SDK.MemberResponse>>();

	constructor() {
		addIcons({ callOutline, mailOutline });
	}
}
