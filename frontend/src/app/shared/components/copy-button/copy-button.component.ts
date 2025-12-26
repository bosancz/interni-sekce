import { Component, Input } from "@angular/core";
import { ToastService } from "src/app/services/toast.service";

@Component({
	selector: "bo-copy-button",
	templateUrl: "./copy-button.component.html",
	styleUrl: "./copy-button.component.scss",
	standalone: false,
})
export class CopyButtonComponent {
	@Input() text?: string | null;
	@Input() label?: string;

	constructor(private toastService: ToastService) {}

	async copy() {
		if (!this.text) return;
		if ("clipboard" in navigator) {
			await navigator.clipboard.writeText(this.text);
			await this.toastService.toast("Zkopírováno do schránky.");
		} else {
			await this.toastService.toast("Kopírování do schránky není podporováno.", { color: "warning" });
		}
	}
}
