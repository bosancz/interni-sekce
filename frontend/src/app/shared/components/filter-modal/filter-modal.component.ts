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
	// When true the modal stages its controls: the filter pills only build a draft while it is open
	// and leave the URL (and the list behind it) untouched. The draft is applied only if the user
	// confirms with "Hotovo"; dismissing — "Zrušit", the backdrop or the back button — drops it. The
	// footer is a Zrušit/Hotovo pair instead of Vymazat/Filtrovat.
	immediate = false;

	constructor(modalCtrl: ModalController) {
		super(modalCtrl);
	}
}
