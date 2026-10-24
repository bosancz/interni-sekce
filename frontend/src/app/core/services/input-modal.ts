import { EventEmitter } from "@angular/core";
import { ModalController } from "@ionic/angular/standalone";

export class InputModalComponent<D = any> {
	submit = new EventEmitter<D>();
	close = new EventEmitter<void>();

	constructor(modalCtrl: ModalController) {
		this.submit.subscribe((data) => modalCtrl.dismiss(data));
		this.close.subscribe(() => modalCtrl.dismiss(null));
	}
}
