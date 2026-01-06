import { Component } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import {
	IonBackButton,
	IonButton,
	IonButtons,
	IonContent,
	IonFooter,
	IonHeader,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonTitle,
	IonToolbar,
	NavController,
} from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { PageTitleDirective } from "src/app/shared/directives/page-title.directive";

@Component({
	selector: "bo-groups-create",
	templateUrl: "./groups-create.component.html",
	styleUrls: ["./groups-create.component.scss"],
	imports: [
		FormsModule,
		IonHeader,
		IonToolbar,
		IonButtons,
		IonBackButton,
		IonTitle,
		IonContent,
		IonList,
		IonItem,
		IonLabel,
		IonInput,
		IonFooter,
		IonButton,
		PageTitleDirective,
	],
})
export class GroupsCreateComponent {
	constructor(
		private api: ApiService,
		private navController: NavController,
	) {}
	async createGroup(form: NgForm) {
		if (form.invalid) return;

		const groupData = form.value;

		await this.api.MembersApi.createGroup(groupData);

		this.navController.back();
	}
}
