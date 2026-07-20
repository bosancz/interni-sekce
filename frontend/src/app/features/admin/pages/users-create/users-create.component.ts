import { Component, OnInit, signal, ViewChild } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { Router } from "@angular/router";
import {
	IonBackButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonInput,
	IonItem,
	IonLabel,
	IonTitle,
	IonToolbar,
} from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action, ActionButtonsComponent } from "src/app/shared/components/action-buttons/action-buttons.component";

@Component({
	selector: "users-create",
	templateUrl: "./users-create.component.html",
	styleUrls: ["./users-create.component.scss"],

	imports: [
		FormsModule,
		IonHeader,
		IonToolbar,
		IonButtons,
		IonBackButton,
		IonTitle,
		IonContent,
		IonItem,
		IonLabel,
		IonInput,
		ActionButtonsComponent,
	],
})
export class UsersCreateComponent implements OnInit {
	actions = signal<Action[]>([
		{
			text: "Vytvořit",
			icon: "add-outline",
			handler: () => this.createUser(),
		},
	]);

	@ViewChild("createUserForm") form!: NgForm;

	constructor(
		private api: ApiService,
		private toastService: ToastService,
		private router: Router,
	) {}

	ngOnInit() {}

	async createUser() {
		// get data from form
		const userData = this.form.value;

		// create the user and wait for confirmation
		const user = await this.api.UsersApi.createUser(userData).then((res) => res.data);

		// show the confrmation
		this.toastService.toast("Uživatel vytvořen.");

		// open the user
		this.router.navigate(["/uzivatele", user.id], { replaceUrl: true });
	}
}
