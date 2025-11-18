import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
	selector: "bo-pagination",
	templateUrl: "./pagination.component.html",
	styleUrls: ["./pagination.component.scss"],
	standalone: false,
})
export class PaginationComponent {
	@Input() page?: number;
	@Input() pages?: number;

	@Output() previous = new EventEmitter<void>();
	@Output() next = new EventEmitter<void>();

	onPrevious() {
		if (this.page && this.page > 1) {
			this.previous.emit();
		}
	}

	onNext() {
		if (this.page && (!this.pages || this.page < this.pages)) {
			this.next.emit();
		}
	}
}
