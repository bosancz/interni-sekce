import { Component, input, output } from "@angular/core";
import { IonLabel, IonList } from "@ionic/angular/standalone";
import { SDK } from "src/sdk";
import { EditButtonTextComponent } from "../../../../shared/components/edit-button-text/edit-button-text.component";
import { IconButtonComponent } from "../../../../shared/components/icon-button/icon-button.component";
import { ItemComponent } from "../../../../shared/components/item/item.component";

@Component({
	selector: "bo-member-contact",
	
	imports: [IonList, IonLabel, ItemComponent, IconButtonComponent, EditButtonTextComponent],
	templateUrl: "./member-contact.component.html",
	styleUrl: "./member-contact.component.scss",
})
export class MemberContactComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
	update = output<Partial<SDK.MemberResponse>>();

	constructor() {}
}
