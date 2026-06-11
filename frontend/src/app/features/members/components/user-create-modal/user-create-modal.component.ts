import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import {
	IonButton,
	IonButtons,
	IonInput,
	IonItem,
	IonList,
	ModalController,
} from "@ionic/angular/standalone";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-user-create-modal",
	templateUrl: "./user-create-modal.component.html",
	styleUrls: ["./user-create-modal.component.scss"],

	imports: [
		ReactiveFormsModule,
		IonList,
		IonItem,
		IonInput,
		IonButtons,
		IonButton,
		ModalLayoutComponent,
	],
})
export class UserCreateModalComponent extends InputModalComponent<SDK.UserCreateBody> implements OnInit {
	data: Partial<SDK.UserCreateBody> = {};

	showValidationErrors = false;

	constructor(modalController: ModalController) {
		super(modalController);
	}

	form = new FormGroup({
		login: new FormControl<string>("", { nonNullable: true, validators: [Validators.required] }),
		email: new FormControl<string>("", { nonNullable: true }),
		memberId: new FormControl<number | undefined>(undefined, { nonNullable: false }),
	});

	ngOnInit() {
		this.form.patchValue({
			login: this.data.login ?? "",
			email: this.data.email ?? "",
			memberId: this.data.memberId,
		});
	}

	async createUser() {
		this.form.markAllAsTouched();

		this.showValidationErrors = true;
		if (!this.form.valid) return;

		const userData = this.form.getRawValue();
		const submitData: SDK.UserCreateBody = {
			login: userData.login,
			email: userData.email || undefined,
			memberId: userData.memberId || undefined,
		};

		this.submit.emit(submitData);
	}
}
