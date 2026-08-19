import { Component, input, output } from "@angular/core";
import { IonButton, IonButtons } from "@ionic/angular/standalone";

@Component({
	selector: "bo-pagination",
	templateUrl: "./pagination.component.html",
	styleUrls: ["./pagination.component.scss"],

	imports: [IonButtons, IonButton],
})
export class PaginationComponent {
	page = input<number | undefined>();
	pages = input<number | undefined>();

	previous = output<void>();
	next = output<void>();

	onPrevious() {
		const page = this.page();
		if (page && page > 1) {
			this.previous.emit();
		}
	}

	onNext() {
		const page = this.page();
		const pages = this.pages();
		if (page && (!pages || page < pages)) {
			this.next.emit();
		}
	}
}
