import { Component, computed, contentChild, input } from "@angular/core";
import { AdminTableCellDirective } from "./admin-table-cell.directive";

@Component({
	selector: "admin-table-column",
	template: "",
})
export class AdminTableColumnComponent {
	header = input<string>("");

	right = input<boolean>(false);

	primary = input<boolean>(false);

	hideMobileLabel = input<boolean>(false);

	cellClass = input<string>("");

	headerClass = input<string>("");

	sort = input<string>("");

	private readonly cellDef = contentChild(AdminTableCellDirective);

	readonly cellTemplate = computed(() => this.cellDef()?.template ?? null);
}
