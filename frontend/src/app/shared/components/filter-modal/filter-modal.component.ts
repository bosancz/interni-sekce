import { NgTemplateOutlet } from "@angular/common";
import { Component, Input, TemplateRef } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { IonButton, IonButtons } from "@ionic/angular/standalone";
import { AbstractModalComponent } from "src/app/services/modal.service";
import { ModalLayoutComponent } from "../modal-layout/modal-layout.component";

@Component({
	selector: "bo-filter-modal",
	templateUrl: "./filter-modal.component.html",
	styleUrl: "./filter-modal.component.scss",
	standalone: true,
	imports: [ModalLayoutComponent, NgTemplateOutlet, IonButtons, IonButton],
})
export class FilterModalComponent extends AbstractModalComponent<boolean> {
	@Input() content!: TemplateRef<any>;

	constructor(modalCtrl: ModalController) {
		super(modalCtrl);
	}
}
