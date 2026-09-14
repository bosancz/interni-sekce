import { KeyValuePipe } from "@angular/common";
import { Component, Input, OnInit, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import {
	IonButton,
	IonButtons,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonSelect,
	IonSelectOption,
	ModalController,
} from "@ionic/angular/standalone";
import { MemberRoles } from "src/app/core/config/member-roles";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { GroupsSelectComponent } from "src/app/shared/components/groups-select/groups-select.component";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-member-create-modal",
	templateUrl: "./member-create-modal.component.html",
	styleUrls: ["./member-create-modal.component.scss"],

	imports: [
		ReactiveFormsModule,
		KeyValuePipe,
		IonList,
		IonItem,
		IonLabel,
		IonInput,
		IonSelect,
		IonSelectOption,
		IonButtons,
		IonButton,
		ModalLayoutComponent,
		GroupsSelectComponent,
	],
})
export class MemberCreateModalComponent extends InputModalComponent<SDK.MemberCreateBody> implements OnInit {
	@Input() defaultGroupId?: number | null;

	roles = MemberRoles;

	showValidationErrors = signal(false);

	form = new FormGroup({
		nickname: new FormControl<string>("", { nonNullable: true, validators: [Validators.required] }),
		firstName: new FormControl<string>("", { nonNullable: true }),
		lastName: new FormControl<string>("", { nonNullable: true }),
		groupId: new FormControl<number | null>(null, { validators: [Validators.required] }),
		role: new FormControl<SDK.MemberCreateBodyRoleEnum | null>(null, { validators: [Validators.required] }),
	});

	constructor(modalController: ModalController) {
		super(modalController);
	}

	ngOnInit() {
		if (this.defaultGroupId != null) this.form.controls.groupId.setValue(this.defaultGroupId);
	}

	createMember() {
		this.form.markAllAsTouched();
		this.showValidationErrors.set(true);

		if (!this.form.valid) return;

		const value = this.form.getRawValue();

		const memberData: SDK.MemberCreateBody = {
			groupId: value.groupId!,
			nickname: value.nickname,
			role: value.role!,
			firstName: value.firstName || null,
			lastName: value.lastName || null,
		};

		this.submit.emit(memberData);
	}
}
