import { NgTemplateOutlet } from "@angular/common";
import { Component, TemplateRef } from "@angular/core";
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
	content!: TemplateRef<any>; // must be set in the parent component

	constructor(modalCtrl: ModalController) {
		super(modalCtrl);
	}
}
