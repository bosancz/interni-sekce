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

export type AdminTableDisplay = "auto" | "table" | "list";
export type AdminTableSortOrder = "ASC" | "DESC";
export interface AdminTableSort {
	sort: string;
	order: AdminTableSortOrder;
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

	order = input<AdminTableSortOrder>("ASC");

	rowClick = output<any>();

	sortChange = output<AdminTableSort>();

	readonly columns = contentChildren(AdminTableColumnComponent);

	readonly tableClass = computed(() => this.defaultTableClass + (this.class() ? " " + this.class() : ""));

	private readonly isDesktop = signal(true);

	readonly mode = computed<"table" | "list">(() => {
		const display = this.display();
		if (display === "table" || display === "list") return display;
		return this.isDesktop() ? "table" : "list";
	});

	readonly lineColumns = computed(() => this.columns().filter((column) => !column.right()));
	readonly rightColumn = computed(() => this.columns().find((column) => column.right()) ?? null);

	readonly skeletonArray = computed(() => Array.from({ length: this.skeletonRows() }));

	constructor(private readonly platformService: PlatformService) {
		addIcons({ caretUp, caretDown, swapVertical });
		this.platformService.isLg.pipe(untilDestroyed(this)).subscribe((isLg) => this.isDesktop.set(isLg));
	}

	onSort(column: AdminTableColumnComponent) {
		const key = column.sort();
		if (!key) return;
		const order: AdminTableSortOrder = this.sort() === key && this.order() === "ASC" ? "DESC" : "ASC";
		this.sortChange.emit({ sort: key, order });
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
