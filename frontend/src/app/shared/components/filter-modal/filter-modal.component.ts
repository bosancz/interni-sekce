import { NgTemplateOutlet } from "@angular/common";
import { Component, TemplateRef } from "@angular/core";
import { IonButton, IonButtons, ModalController } from "@ionic/angular/standalone";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "../modal-layout/modal-layout.component";

@Component({
	selector: "bo-filter-modal",
	templateUrl: "./filter-modal.component.html",
	styleUrl: "./filter-modal.component.scss",

	imports: [ModalLayoutComponent, NgTemplateOutlet, IonButtons, IonButton],
})
export class FilterModalComponent extends InputModalComponent<boolean> {
	content!: TemplateRef<any>; // must be set in the parent component
	// When true the modal is a plain disclosure sheet: its controls apply immediately (they write
	// straight to the URL), so the footer is a single "Hotovo" close button instead of Vymazat/Filtrovat.
	immediate = false;

	constructor(modalCtrl: ModalController) {
		super(modalCtrl);
	}
}
