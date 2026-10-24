import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { IonButton, IonButtons, IonInput, IonItem, IonList, ModalController } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "bo-event-create-modal",
	templateUrl: "./event-create-modal.component.html",
	styleUrls: ["./event-create-modal.component.scss"],

	imports: [
		CommonModule,
		ReactiveFormsModule,
		IonList,
		IonItem,
		IonInput,
		IonButtons,
		IonButton,
		ModalLayoutComponent,
	],
})
export class EventCreateModalComponent extends InputModalComponent<SDK.EventCreateBody> implements OnInit {
	data: Partial<SDK.EventCreateBody> = {};

	showValidationErrors = false;

	constructor(modalController: ModalController) {
		super(modalController);
	}

	form = new FormGroup({
		name: new FormControl<string>("", { nonNullable: true }),
		dateFrom: new FormControl<string>("", { nonNullable: true }),
		dateTill: new FormControl<string>("", { nonNullable: true }),
	});

	ngOnInit() {
		this.form.patchValue({
			dateFrom: this.data.dateFrom,
			dateTill: this.data.dateTill,
			name: this.data.name,
		});

		this.form.controls.dateFrom.valueChanges.pipe(untilDestroyed(this)).subscribe((dateFrom) => {
			const dateTill = this.form.controls.dateTill.value;
			if (/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) && dateFrom >= "1900" && (!dateTill || dateTill < dateFrom))
				this.form.controls.dateTill.setValue(dateFrom);
		});
	}

	async createEvent() {
		this.form.markAllAsTouched();

		this.showValidationErrors = true;
		if (!this.form.valid) return;

		// TODO: create a typed form
		let eventData = this.form.getRawValue();

		if (eventData.dateFrom && eventData.dateTill) {
			const dates = [eventData.dateFrom, eventData.dateTill];
			dates.sort();
			eventData.dateFrom = dates[0];
			eventData.dateTill = dates[1];
		}

		this.submit.emit({ ...eventData, description: null, type: null });
	}
}
