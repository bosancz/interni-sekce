import { CommonModule } from "@angular/common";
import { Component, computed, contentChildren, input, output, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonIcon, IonItem, IonLabel, IonList, IonSkeletonText } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { caretDown, caretUp, swapVertical } from "ionicons/icons";
import { PlatformService } from "src/app/core/services/platform.service";
import { Action } from "../action-buttons/action-buttons.component";
import { AdminTableActionsComponent } from "./admin-table-actions.component";
import { AdminTableColumnComponent } from "./admin-table-column.component";
import { AdminTableValueDirective } from "./admin-table-value.directive";

export type AdminTableDisplay = "auto" | "table" | "list";
export type AdminTableSortOrder = "ASC" | "DESC";
export interface AdminTableSort {
	sort: string;
	order: string;
}

export interface AdminTableSortKey {
	key: string;
	order: AdminTableSortOrder;
}

export function parseAdminTableSort(sort: string | null | undefined, order: string | null | undefined) {
	const orders = (order ?? "").split(",");
	return (sort ?? "")
		.split(",")
		.map(
			(key, i): AdminTableSortKey => ({
				key: key.trim(),
				order: orders[i]?.trim().toUpperCase() === "DESC" ? "DESC" : "ASC",
			}),
		)
		.filter((item) => !!item.key);
}

export function serializeAdminTableSort(keys: AdminTableSortKey[]): AdminTableSort {
	return { sort: keys.map((item) => item.key).join(","), order: keys.map((item) => item.order).join(",") };
}

type RowFn<T> = ((row: any) => T) | null;

@UntilDestroy()
@Component({
	selector: "admin-table",
	templateUrl: "./admin-table.component.html",
	styleUrls: ["./admin-table.component.scss"],
	imports: [
		CommonModule,
		RouterLink,
		IonList,
		IonItem,
		IonLabel,
		IonIcon,
		IonSkeletonText,
		AdminTableActionsComponent,
		AdminTableValueDirective,
	],
})
export class AdminTableComponent {
	defaultTableClass = "table table-hover";

	class = input<string>("");

	rows = input<readonly any[] | null | undefined>(undefined);

	display = input<AdminTableDisplay>("auto");

	rowLink = input<RowFn<any[] | string | null | undefined>>(null);

	rowId = input<RowFn<string | null | undefined>>(null);

	rowClass = input<RowFn<string | Record<string, boolean> | null | undefined>>(null);

	trackBy = input<((index: number, row: any) => any) | null>(null);

	loading = input<boolean>(false);

	skeletonRows = input<number>(5);

	actions = input<((row: any) => Action[]) | null>(null);

	actionsHeader = input<((row: any) => string | null | undefined) | null>(null);

	sort = input<string | null>(null);

	order = input<string>("ASC");

	multiSort = input<boolean>(false);

	rowClick = output<any>();

	sortChange = output<AdminTableSort>();

	columnDefs = input<readonly AdminTableColumnComponent[] | null>(null);

	private readonly contentColumns = contentChildren(AdminTableColumnComponent);

	readonly columns = computed(() => this.columnDefs() ?? this.contentColumns());

	readonly tableClass = computed(() => this.defaultTableClass + (this.class() ? " " + this.class() : ""));

	private readonly isDesktop = signal(true);

	readonly mode = computed<"table" | "list">(() => {
		const display = this.display();
		if (display === "table" || display === "list") return display;
		return this.isDesktop() ? "table" : "list";
	});

	readonly lineColumns = computed(() => this.columns().filter((column) => !column.right() && !column.start()));
	readonly primaryColumns = computed(() => this.lineColumns().filter((column) => column.primary()));
	readonly valueColumns = computed(() =>
		this.lineColumns().filter((column) => !column.primary() && !column.hideMobileLabel() && !column.below()),
	);
	readonly blockColumns = computed(() =>
		this.lineColumns().filter((column) => !column.primary() && column.hideMobileLabel() && !column.below()),
	);
	readonly tableColumns = computed(() => this.columns().filter((column) => !column.below()));
	readonly belowColumns = computed(() => this.columns().filter((column) => column.below()));
	readonly belowIndent = computed(() => (this.tableColumns()[0]?.start() ? 1 : 0));
	readonly belowColspan = computed(() => this.tableColumns().length - this.belowIndent() + (this.actions() ? 1 : 0));
	readonly startColumn = computed(() => this.columns().find((column) => column.start()) ?? null);
	readonly rightColumn = computed(() => this.columns().find((column) => column.right()) ?? null);

	readonly skeletonArray = computed(() => Array.from({ length: this.skeletonRows() }));

	readonly activeSort = computed(() => parseAdminTableSort(this.sort(), this.order()));

	sortIndex(key: string | null) {
		return key ? this.activeSort().findIndex((item) => item.key === key) : -1;
	}

	sortTitle(key: string | null) {
		const index = this.sortIndex(key);
		if (index < 0) return this.multiSort() && this.activeSort().length ? "Přidat řazení" : "Seřadit vzestupně";
		if (this.activeSort()[index].order === "ASC") return "Seřadit sestupně";
		return this.multiSort() ? "Zrušit řazení" : "Seřadit vzestupně";
	}

	constructor(private readonly platformService: PlatformService) {
		addIcons({ caretUp, caretDown, swapVertical });
		this.platformService.isLg.pipe(untilDestroyed(this)).subscribe((isLg) => this.isDesktop.set(isLg));
	}

	onSort(column: AdminTableColumnComponent) {
		const key = column.sort();
		if (!key) return;

		const current = this.activeSort();
		const index = current.findIndex((item) => item.key === key);

		if (!this.multiSort()) {
			const order: AdminTableSortOrder = index === 0 && current[0].order === "ASC" ? "DESC" : "ASC";
			this.sortChange.emit({ sort: key, order });
			return;
		}

		let next: AdminTableSortKey[];
		if (index < 0) next = [...current, { key, order: "ASC" }];
		else if (current[index].order === "ASC")
			next = current.map((item, i) => (i === index ? { ...item, order: "DESC" } : item));
		else next = current.filter((_, i) => i !== index);

		this.sortChange.emit(serializeAdminTableSort(next));
	}

	trackRow = (index: number, row: any) => {
		const fn = this.trackBy();
		if (fn) return fn(index, row);
		return row?.id ?? row;
	};

	resolveLink(row: any) {
		return this.rowLink()?.(row) ?? null;
	}

	resolveId(row: any) {
		return this.rowId()?.(row) ?? null;
	}

	resolveClass(row: any) {
		return this.rowClass()?.(row) ?? null;
	}

	resolveActions(row: any) {
		return this.actions()?.(row) ?? [];
	}

	resolveActionsHeader(row: any) {
		return this.actionsHeader()?.(row) ?? null;
	}

	onRowClick(row: any) {
		this.rowClick.emit(row);
	}
}
