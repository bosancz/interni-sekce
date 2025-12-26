import { Component, Input } from "@angular/core";

@Component({
	selector: "bo-delete-button",
	templateUrl: "./delete-button.component.html",
	styleUrl: "./delete-button.component.scss",
	standalone: false,
})
export class DeleteButtonComponent {
	@Input() label?: string;
}
