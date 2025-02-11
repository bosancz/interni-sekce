import { Component, Input } from "@angular/core";

@Component({
    selector: "bo-edit-button",
    templateUrl: "./edit-button.component.html",
    styleUrls: ["./edit-button.component.scss"],
    standalone: false
})
export class EditButtonComponent {
  @Input() label?: string;
  @Input() disabled?: boolean;
}
