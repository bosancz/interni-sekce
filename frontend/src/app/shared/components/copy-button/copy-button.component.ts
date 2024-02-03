import { Component, Input } from "@angular/core";
import { ToastService } from "src/app/services/toast.service";

@Component({
  selector: "bo-copy-button",
  templateUrl: "./copy-button.component.html",
  styleUrl: "./copy-button.component.scss",
})
export class CopyButtonComponent {
  @Input() text?: string;

  constructor(private toastService: ToastService) {}

  async copy() {
    if (!this.text) return;
    await navigator.clipboard.writeText(this.text);
    await this.toastService.toast("Zkopírováno do schránky.");
  }
}
