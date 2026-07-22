import { Component, computed, contentChild, input } from "@angular/core";
import { AdminTableCellDirective } from "./admin-table-cell.directive";

/**
 * Declares one column of an `admin-table`. Renders nothing on its own — it is a
 * configuration holder that the parent `admin-table` reads via a content query.
 *
 * Usage:
 * ```html
 * <admin-table-column header="Název" [primary]="true">
 *   <ng-container *adminCell="let row">{{ row.name }}</ng-container>
 * </admin-table-column>
 * ```
 */
@Component({
	selector: "admin-table-column",
	template: "",
})
export class AdminTableColumnComponent {
	/** Header text; also used as the line label in the mobile list view. */
	header = input<string>("");

	/** On mobile, render this column on the right (`slot="end"`) instead of as a line. */
	right = input<boolean>(false);

	/** On mobile, render this column as the item title (`<h3>`, no label) instead of a labelled line. */
	primary = input<boolean>(false);

	/** On mobile, suppress the `header:` label prefix for this line. */
	hideMobileLabel = input<boolean>(false);

	/** Extra class(es) applied to the `<td>` in table view. */
	cellClass = input<string>("");

	/** Extra class(es) applied to the `<th>` in table view. */
	headerClass = input<string>("");

	/**
	 * Backend sort key for this column. When set, the column header becomes a
	 * clickable sort toggle in table view (see `admin-table` `[sort]`/`(sortChange)`).
	 */
	sort = input<string>("");

	private readonly cellDef = contentChild(AdminTableCellDirective);

	readonly cellTemplate = computed(() => this.cellDef()?.template ?? null);
}
