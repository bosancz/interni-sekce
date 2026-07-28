import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
	IonButton,
	IonIcon,
	IonItem,
	IonItemDivider,
	IonList,
	IonSelect,
	IonSelectOption,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowDown, arrowUp } from "ionicons/icons";
import { AdminTableSort, AdminTableSortOrder } from "../admin-table/admin-table.component";

export interface SortOption {
	/** Backend sort key (matches an `admin-table-column`'s `sort`). */
	key: string;
	label: string;
}

/**
 * Mobile-friendly sort control for the filter modal: a column dropdown with an
 * inline ascending/descending toggle. Mirrors the desktop `admin-table` header
 * sorting, emitting the same `sortChange` shape so pages reuse their existing
 * handler. Selecting "Výchozí" emits an empty key to fall back to the default order.
 *
 * Dumb control: renders `sort`/`order` and emits `sortChange`. Whether that applies immediately or
 * is staged until the modal is confirmed is decided by the page's FilterModel, not here.
 */
@Component({
	selector: "bo-sort-select",
	templateUrl: "./sort-select.component.html",
	imports: [
		FormsModule,
		IonList,
		IonItem,
		IonItemDivider,
		IonButton,
		IonIcon,
		IonSelect,
		IonSelectOption,
	],
})
export class SortSelectComponent {
	options = input.required<SortOption[]>();
	sort = input<string | null>(null);
	order = input<AdminTableSortOrder>("ASC");
	label = input<string>("Řazení");

	sortChange = output<AdminTableSort>();

	constructor() {
		addIcons({ arrowUp, arrowDown });
	}

	selectColumn(key: string | null) {
		if (!key) {
			this.sortChange.emit({ sort: "", order: "ASC" });
			return;
		}
		this.sortChange.emit({ sort: key, order: this.order() ?? "ASC" });
	}

	toggleOrder() {
		const key = this.sort();
		if (!key) return;
		this.sortChange.emit({ sort: key, order: this.order() === "ASC" ? "DESC" : "ASC" });
	}
}
