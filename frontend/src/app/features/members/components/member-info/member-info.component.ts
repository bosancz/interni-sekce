import { DatePipe } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { IonLabel, IonList } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { SDK } from "src/sdk";
import { EditButtonDateComponent } from "../../../../shared/components/edit-button-date/edit-button-date.component";
import { EditButtonNameComponent } from "../../../../shared/components/edit-button-name/edit-button-name.component";
import { EditButtonTextComponent } from "../../../../shared/components/edit-button-text/edit-button-text.component";
import { ItemComponent } from "../../../../shared/components/item/item.component";

@UntilDestroy()
@Component({
	selector: "bo-member-info",
	templateUrl: "./member-info.component.html",
	styleUrls: ["./member-info.component.scss"],
	imports: [
		IonList,
		IonLabel,
		DatePipe,
		ItemComponent,
		EditButtonNameComponent,
		EditButtonTextComponent,
		EditButtonDateComponent,
	],
})
export class MemberInfoComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
	update = output<Partial<SDK.MemberResponse>>();
}
