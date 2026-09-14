import { Injectable } from "@angular/core";
import { ToastController } from "@ionic/angular/standalone";
import { ToastOptions } from "@ionic/core";
import { Observable } from "rxjs";

@Injectable({
	providedIn: "root",
})
export class ToastService {
	constructor(public toastController: ToastController) {}

	toast(toast: string, toastOptions?: ToastOptions): Promise<HTMLIonToastElement>;
	toast(
		toast: string,
		toastOptions?: ToastOptions,
	): Promise<HTMLIonToastElement> | { onAction: () => Observable<void> } {
		toastOptions = {
			...toastOptions,
			message: toast,
			duration: toastOptions?.duration ?? 2000,
		};

		return this.toastController.create(toastOptions).then((toast) => {
			toast.present();
			return toast;
		});
	}
}
