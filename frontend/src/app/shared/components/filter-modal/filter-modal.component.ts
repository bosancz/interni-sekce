import { NgTemplateOutlet } from "@angular/common";
import { Component, input, TemplateRef } from "@angular/core";
import { IonButton, IonButtons, ModalController } from "@ionic/angular/standalone";
import { AbstractModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "../modal-layout/modal-layout.component";

@Component({
	selector: "bo-filter-modal",
	templateUrl: "./filter-modal.component.html",
	styleUrl: "./filter-modal.component.scss",

	imports: [ModalLayoutComponent, NgTemplateOutlet, IonButtons, IonButton],
})
export class FilterModalComponent extends AbstractModalComponent<boolean> {
	content = input.required<TemplateRef<any>>();

	constructor(modalCtrl: ModalController) {
		super(modalCtrl);
	}
}
