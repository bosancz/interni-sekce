import { Component, effect, input } from "@angular/core";

@Component({
	selector: "admin-table",
	templateUrl: "./admin-table.component.html",
	styleUrls: ["./admin-table.component.scss"],
	
})
export class AdminTableComponent {
	defaultTableClass = "table table-hover";
	tableClass: string;

	class = input<string>("");

	constructor() {
		this.tableClass = this.defaultTableClass;
		effect(() => {
			const classNames = this.class();
			this.tableClass = this.defaultTableClass + (classNames ? " " + classNames : "");
		});
	}
}
