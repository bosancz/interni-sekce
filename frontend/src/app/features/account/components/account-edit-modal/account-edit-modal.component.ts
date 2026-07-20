import { KeyValuePipe } from "@angular/common";
import { Component } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import {
	IonButton,
	IonButtons,
	IonInput,
	IonItem,
	IonList,
	IonSelect,
	IonSelectOption,
	ModalController,
} from "@ionic/angular/standalone";
import { UserRoles } from "src/app/core/config/user-roles";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-account-edit-modal",
	templateUrl: "./account-edit-modal.component.html",
	styleUrls: ["./account-edit-modal.component.scss"],

	imports: [
		ReactiveFormsModule,
		KeyValuePipe,
		IonList,
		IonItem,
		IonInput,
		IonSelect,
		IonSelectOption,
		IonButtons,
		IonButton,
		ModalLayoutComponent,
	],
})
export class AccountEditModalComponent extends InputModalComponent<SDK.UserUpdateBody> {
	roles = UserRoles;

	form = new FormGroup({
		email: new FormControl<string>("", { nonNullable: true, validators: [Validators.email] }),
		roles: new FormControl<SDK.UserUpdateBodyRolesEnum[]>([], { nonNullable: true }),
	});

	constructor(modalController: ModalController) {
		super(modalController);
	}

	/** Called by ModalService via componentProps to seed the form. */
	set user(user: SDK.AccountResponseWithLinks | null | undefined) {
		this.form.reset({
			email: user?.email ?? "",
			roles: (user?.roles ?? []) as SDK.UserUpdateBodyRolesEnum[],
		});
	}

	save() {
		this.form.markAllAsTouched();

		if (!this.form.valid) return;

		const value = this.form.getRawValue();

		const data: SDK.UserUpdateBody = {
			// omit email entirely when left blank, to avoid clearing an existing address
			...(value.email ? { email: value.email } : {}),
			roles: value.roles,
		};

		this.submit.emit(data);
	}
}
