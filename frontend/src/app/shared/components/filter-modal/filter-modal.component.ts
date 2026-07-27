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
	// When true the modal stages its controls: they write to the URL live (so the list previews the
	// change in the background), but the change only sticks if the user confirms with "Hotovo".
	// Dismissing — "Zrušit", the backdrop or the back button — reverts to the filters from before the
	// modal was opened. The footer is a Zrušit/Hotovo pair instead of Vymazat/Filtrovat.
	immediate = false;

	constructor(modalCtrl: ModalController) {
		super(modalCtrl);
	}
}
