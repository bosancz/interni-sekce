import { CommonModule } from "@angular/common";
import { Component, computed, contentChildren, input, output, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonItem, IonLabel, IonList, IonSkeletonText } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { PlatformService } from "src/app/core/services/platform.service";
import { Action } from "../action-buttons/action-buttons.component";
import { AdminTableActionsComponent } from "./admin-table-actions.component";
import { AdminTableColumnComponent } from "./admin-table-column.component";

export type AdminTableDisplay = "auto" | "table" | "list";

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

	rowClick = output<any>();

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

	constructor(private readonly platformService: PlatformService) {
		this.platformService.isLg.pipe(untilDestroyed(this)).subscribe((isLg) => this.isDesktop.set(isLg));
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
