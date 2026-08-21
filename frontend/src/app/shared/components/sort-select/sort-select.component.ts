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
	key: string;
	label: string;
}

@Component({
	selector: "bo-sort-select",
	templateUrl: "./sort-select.component.html",
	imports: [FormsModule, IonList, IonItem, IonItemDivider, IonButton, IonIcon, IonSelect, IonSelectOption],
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
