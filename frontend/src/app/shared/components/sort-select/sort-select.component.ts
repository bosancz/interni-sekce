import { Component, computed, forwardRef, input, output, signal } from "@angular/core";
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
import { STAGED_CONTROL, StagedControl } from "../staged-control";

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
 * Like the filter pills, it participates in the modal's staging (see {@link StagedControl}): while
 * the modal is open the chosen sort only builds a draft and is emitted on confirm.
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
	providers: [{ provide: STAGED_CONTROL, useExisting: forwardRef(() => SortSelectComponent) }],
})
export class SortSelectComponent implements StagedControl {
	options = input.required<SortOption[]>();
	sort = input<string | null>(null);
	order = input<AdminTableSortOrder>("ASC");
	label = input<string>("Řazení");

	sortChange = output<AdminTableSort>();

	// While staging, selections write here instead of emitting; null means "not staging".
	private draft = signal<AdminTableSort | null>(null);

	// What the control should display: the draft while staging, otherwise the committed inputs.
	effectiveSort = computed<string | null>(() => {
		const draft = this.draft();
		return draft ? draft.sort || null : this.sort();
	});
	effectiveOrder = computed<AdminTableSortOrder>(() => {
		const draft = this.draft();
		return (draft ? draft.order : this.order()) ?? "ASC";
	});

	constructor() {
		addIcons({ arrowUp, arrowDown });
	}

	selectColumn(key: string | null) {
		this.apply(key ? { sort: key, order: this.effectiveOrder() } : { sort: "", order: "ASC" });
	}

	toggleOrder() {
		const key = this.effectiveSort();
		if (!key) return;
		this.apply({ sort: key, order: this.effectiveOrder() === "ASC" ? "DESC" : "ASC" });
	}

	// --- staging, driven by the parent <bo-filter> around the mobile filter modal ---

	beginStaging() {
		if (this.draft() === null) this.draft.set({ sort: this.sort() ?? "", order: this.order() ?? "ASC" });
	}

	commit() {
		const draft = this.draft();
		this.draft.set(null);
		if (draft && (draft.sort !== (this.sort() ?? "") || draft.order !== this.order())) {
			this.sortChange.emit(draft);
		}
	}

	cancel() {
		this.draft.set(null);
	}

	// Route a new sort to the draft while staging, or straight out as an emit when live.
	private apply(sort: AdminTableSort) {
		if (this.draft() === null) this.sortChange.emit(sort);
		else this.draft.set(sort);
	}
}
