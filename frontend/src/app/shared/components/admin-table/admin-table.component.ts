import { Component, computed, input } from "@angular/core";

@Component({
	selector: "admin-table",
	templateUrl: "./admin-table.component.html",
	styleUrls: ["./admin-table.component.scss"],
})
export class AdminTableComponent {
	defaultTableClass = "table table-hover";

	class = input<string>("");

	tableClass = computed(() => this.defaultTableClass + (this.class() ? " " + this.class() : ""));
}
