import { Component, computed, input, output } from "@angular/core";
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
import { AdminTableSort, parseAdminTableSort } from "../admin-table/admin-table.component";

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
	order = input<string>("ASC");
	label = input<string>("Řazení");

	sortChange = output<AdminTableSort>();

	private readonly primary = computed(() => parseAdminTableSort(this.sort(), this.order())[0] ?? null);
	readonly primaryKey = computed(() => this.primary()?.key ?? null);
	readonly primaryOrder = computed(() => this.primary()?.order ?? "ASC");

	constructor() {
		addIcons({ arrowUp, arrowDown });
	}

	selectColumn(key: string | null) {
		if (!key) {
			this.sortChange.emit({ sort: "", order: "ASC" });
			return;
		}
		this.sortChange.emit({ sort: key, order: this.primaryOrder() });
	}

	toggleOrder() {
		const key = this.primaryKey();
		if (!key) return;
		this.sortChange.emit({ sort: key, order: this.primaryOrder() === "ASC" ? "DESC" : "ASC" });
	}
}
