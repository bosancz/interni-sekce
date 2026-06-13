import { KeyValuePipe } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { IonLabel, IonList, IonSelect, IonSelectOption } from "@ionic/angular/standalone";
import { UserRoles } from "src/app/core/config/user-roles";
import { SDK } from "src/sdk";
import { EditButtonTextComponent } from "../../../../shared/components/edit-button-text/edit-button-text.component";
import { ItemComponent } from "../../../../shared/components/item/item.component";

@Component({
	selector: "bo-user-info",
	templateUrl: "./user-info.component.html",
	styleUrls: ["./user-info.component.scss"],
	imports: [IonList, IonLabel, IonSelect, IonSelectOption, KeyValuePipe, ItemComponent, EditButtonTextComponent],
})
export class UserInfoComponent {
	user = input<SDK.UserResponseWithLinks | null | undefined>();
	update = output<SDK.UserUpdateBody>();

	userRoles = UserRoles;

	updateLogin(login: string | null) {
		// login is NOT NULL + unique in the database, never send an empty value
		if (login) this.update.emit({ login });
	}

	updateEmail(email: string | null) {
		if (email) this.update.emit({ email });
	}
}
