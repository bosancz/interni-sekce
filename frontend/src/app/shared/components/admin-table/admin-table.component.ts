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
	/** Active sort key(s), comma-joined in priority order (e.g. `"group,role"`); `""` when unsorted. */
	sort: string;
	/** Matching direction(s), comma-joined to line up with `sort` (e.g. `"ASC,DESC"`). */
	order: string;
}

/** Signature of the per-row callbacks (link / id / class). */
type RowFn<T> = ((row: any) => T) | null;

/**
 * Responsive data table.
 *
 * - With declarative `<admin-table-column>` children it renders as a `<table>` on
 *   desktop and as an `<ion-list>` on mobile (each column becomes a line, one
 *   column can be flagged `[right]` to sit on the right). Use `[display]` to force
 *   `"table"` or `"list"` regardless of viewport.
 * - Without columns it falls back to projecting raw `<thead>`/`<tbody>` markup
 *   (table-only), preserving the original, pre-responsive API.
 */
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

	/** Row data. Leave unset when using the legacy raw-markup projection. */
	rows = input<readonly any[] | null | undefined>(undefined);

	/** Force a rendering mode, or `"auto"` (default) to switch on viewport width. */
	display = input<AdminTableDisplay>("auto");

	/** `(row) => routerLink` — makes each row navigate/clickable. */
	rowLink = input<RowFn<any[] | string | null | undefined>>(null);

	/** `(row) => elementId` — sets the id on each row element (e.g. for scroll targeting). */
	rowId = input<RowFn<string | null | undefined>>(null);

	/** `(row) => ngClass value` — extra class(es) per row. */
	rowClass = input<RowFn<string | Record<string, boolean> | null | undefined>>(null);

	/** `(index, row) => trackBy key`. Defaults to `row.id` (or the row itself). */
	trackBy = input<((index: number, row: any) => any) | null>(null);

	/** Show skeleton placeholder rows instead of data. */
	loading = input<boolean>(false);

	/** Number of skeleton rows to show while `loading`. */
	skeletonRows = input<number>(5);

	/**
	 * `(row) => Action[]` — per-row three-dots menu. Rendered as a trailing cell in
	 * table mode and inside the item (right side) in list mode, so the actions are
	 * available on both desktop and mobile.
	 */
	actions = input<((row: any) => Action[]) | null>(null);

	/** `(row) => header` — title shown above the actions on the mobile ActionSheet. */
	actionsHeader = input<((row: any) => string | null | undefined) | null>(null);

	/** Active sort key(s), comma-separated in priority order (e.g. `"group,role"`), or `null` when unsorted. */
	sort = input<string | null>(null);

	/** Active sort direction(s), comma-separated to match each `sort` key (e.g. `"ASC,DESC"`). */
	order = input<AdminTableSortOrder | string>("ASC");

	rowClick = output<any>();

	/** Emitted when a sortable header is clicked, with the next sort key + direction. */
	sortChange = output<AdminTableSort>();

	readonly columns = contentChildren(AdminTableColumnComponent);

	readonly tableClass = computed(() => this.defaultTableClass + (this.class() ? " " + this.class() : ""));

	// Desktop when the viewport is at least the lg breakpoint (992px), matching the
	// `d-*-lg` utility breakpoint used across the app.
	private readonly isDesktop = signal(true);

	readonly mode = computed<"table" | "list">(() => {
		const display = this.display();
		if (display === "table" || display === "list") return display;
		return this.isDesktop() ? "table" : "list";
	});

	readonly lineColumns = computed(() => this.columns().filter((column) => !column.right()));
	readonly rightColumn = computed(() => this.columns().find((column) => column.right()) ?? null);

	readonly skeletonArray = computed(() => Array.from({ length: this.skeletonRows() }));

	/** Parsed active sort, in priority order — pairs each `sort` key with its direction. */
	readonly activeSort = computed<{ key: string; order: AdminTableSortOrder }[]>(() => {
		const keys = (this.sort() ?? "").split(",").map((k) => k.trim()).filter((k) => !!k);
		const orders = String(this.order() ?? "").split(",");
		return keys.map((key, i) => ({
			key,
			order: (orders[i] ?? "").trim().toUpperCase() === "DESC" ? "DESC" : "ASC",
		}));
	});

	/** Zero-based position of a column in the active sort, or -1 when it is not sorted. */
	sortIndex(key: string | null): number {
		if (!key) return -1;
		return this.activeSort().findIndex((s) => s.key === key);
	}

	constructor(private readonly platformService: PlatformService) {
		addIcons({ caretUp, caretDown, swapVertical });
		this.platformService.isLg.pipe(untilDestroyed(this)).subscribe((isLg) => this.isDesktop.set(isLg));
	}

	/**
	 * Cycle a column header through the three-state multi-sort: an unsorted column is
	 * appended as the last (lowest-priority) key ascending; a key sorted ASC flips to
	 * DESC in place; a key sorted DESC is removed, so the remaining keys shift up in
	 * priority. Emits the whole list comma-joined, or `{ sort: "", order: "" }` once the
	 * last key is cycled off (which pages treat as "back to default").
	 */
	onSort(column: AdminTableColumnComponent) {
		const key = column.sort();
		if (!key) return;

		const current = this.activeSort();
		const i = current.findIndex((s) => s.key === key);

		let next: { key: string; order: AdminTableSortOrder }[];
		if (i < 0) next = [...current, { key, order: "ASC" }];
		else if (current[i].order === "ASC")
			next = current.map((s, j) => (j === i ? { ...s, order: "DESC" as const } : s));
		else next = current.filter((_, j) => j !== i);

		this.sortChange.emit({
			sort: next.map((s) => s.key).join(","),
			order: next.map((s) => s.order).join(","),
		});
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
