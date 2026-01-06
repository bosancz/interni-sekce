import { Component, input } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { ToastService } from "src/app/core/services/toast.service";

@Component({
	selector: "bo-copy-button",
	templateUrl: "./copy-button.component.html",
	styleUrl: "./copy-button.component.scss",

	imports: [IonButton, IonIcon],
})
export class CopyButtonComponent {
	text = input<string | null | undefined>();
	label = input<string | undefined>();

	constructor(private toastService: ToastService) {}

	async copy() {
		const text = this.text();
		if (!text) return;
		if ("clipboard" in navigator) {
			await navigator.clipboard.writeText(text);
			await this.toastService.toast("Zkopírováno do schránky.");
		} else {
			await this.toastService.toast("Kopírování do schránky není podporováno.", { color: "warning" });
		}
	}
}
