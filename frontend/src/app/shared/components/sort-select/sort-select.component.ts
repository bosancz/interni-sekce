import { Component, computed, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
	IonItem,
	IonItemDivider,
	IonLabel,
	IonList,
	IonSegment,
	IonSegmentButton,
	IonSelect,
	IonSelectOption,
} from "@ionic/angular/standalone";
import { AdminTableSort, AdminTableSortOrder } from "../admin-table/admin-table.component";

export interface SortOption {
	/** Backend sort key (matches an `admin-table-column`'s `sort`). */
	key: string;
	label: string;
}

/**
 * Mobile-friendly sort control for the filter modal: a column dropdown plus an
 * ascending/descending segment. Mirrors the desktop `admin-table` header sorting,
 * emitting the same `sortChange` shape so pages reuse their existing handler.
 * Selecting "Výchozí" emits an empty key to fall back to the default order.
 *
 * This control stays single-column: the `[sort]`/`[order]` inputs may arrive with
 * commas (a desktop multi-key URL opened on a phone), so it shows only the *first*
 * key/direction, and selecting a column emits a single key/order pair — replacing any
 * multi-key sort with the user's single-column choice.
 */
@Component({
	selector: "bo-sort-select",
	templateUrl: "./sort-select.component.html",
	imports: [
		FormsModule,
		IonList,
		IonItem,
		IonItemDivider,
		IonLabel,
		IonSegment,
		IonSegmentButton,
		IonSelect,
		IonSelectOption,
	],
})
export class SortSelectComponent {
	options = input.required<SortOption[]>();
	sort = input<string | null>(null);
	order = input<AdminTableSortOrder | string>("ASC");
	label = input<string>("Řazení");

	sortChange = output<AdminTableSort>();

	/** First key of a (possibly comma-separated) `sort`, so the select always has a matching option. */
	readonly primaryKey = computed<string | null>(() => {
		const first = (this.sort() ?? "").split(",")[0]?.trim();
		return first || null;
	});

	/** Direction paired with {@link primaryKey}; falls back to ASC. */
	readonly primaryOrder = computed<AdminTableSortOrder>(() => {
		const first = String(this.order() ?? "").split(",")[0]?.trim().toUpperCase();
		return first === "DESC" ? "DESC" : "ASC";
	});

	selectColumn(key: string | null) {
		if (!key) {
			this.sortChange.emit({ sort: "", order: "ASC" });
			return;
		}
		this.sortChange.emit({ sort: key, order: this.primaryOrder() });
	}

	selectOrder(order: AdminTableSortOrder) {
		const key = this.primaryKey();
		if (!key) return;
		this.sortChange.emit({ sort: key, order });
	}
}
