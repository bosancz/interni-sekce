import { Component, OnInit, ViewChild } from "@angular/core";
import { NgForm } from "@angular/forms";
import { Router } from "@angular/router";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";

@Component({
	selector: "users-create",
	templateUrl: "./users-create.component.html",
	styleUrls: ["./users-create.component.scss"],
	standalone: false,
})
export class UsersCreateComponent implements OnInit {
	actions: Action[] = [
		{
			text: "Vytvořit",
			icon: "add-outline",
			handler: () => this.createUser(),
		},
	];

	@ViewChild("createUserForm") form!: NgForm;

	constructor(
		private api: BackendApi,
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
