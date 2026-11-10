import { NgTemplateOutlet } from "@angular/common";
import { Component, contentChild, Directive, input, output, TemplateRef } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
	IonButton,
	IonContent,
	IonIcon,
	IonItem,
	IonItemDivider,
	IonList,
	IonPopover,
	IonToggle,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { eyeOutline } from "ionicons/icons";
import { PlatformService } from "src/app/core/services/platform.service";
import { TooltipDirective } from "../../directives/tooltip.directive";
import { AdminTableSort, AdminTableSortOrder } from "../admin-table/admin-table.component";
import { ColumnsSelectComponent } from "../columns-select/columns-select.component";
import { FilterPillComponent } from "../filter-pill/filter-pill.component";
import { FilterComponent, FilterData } from "../filter/filter.component";
import { SortOption, SortSelectComponent } from "../sort-select/sort-select.component";
import { PeopleColumns } from "./people-columns";

@Directive({ selector: "[boPeopleFilterPills]" })
export class PeopleFilterPillsDirective {
	constructor(public readonly template: TemplateRef<unknown>) {}
}

let nextId = 0;

@Component({
	selector: "bo-people-filter",
	templateUrl: "./people-filter.component.html",
	styleUrl: "./people-filter.component.scss",
	imports: [
		NgTemplateOutlet,
		FilterComponent,
		FilterPillComponent,
		ColumnsSelectComponent,
		SortSelectComponent,
		TooltipDirective,
		IonButton,
		IonContent,
		IonIcon,
		IonItem,
		IonItemDivider,
		IonList,
		IonPopover,
		IonToggle,
	],
})
export class PeopleFilterComponent {
	columns = input.required<PeopleColumns>();
	sortOptions = input.required<SortOption[]>();
	sort = input<string | null>(null);
	order = input<AdminTableSortOrder>("ASC");
	showInactive = input<boolean | null>(null);
	autofocus = input<boolean>(true);

	sortChange = output<AdminTableSort>();
	showInactiveChange = output<boolean>();
	change = output<FilterData>();

	readonly pills = contentChild(PeopleFilterPillsDirective);

	readonly viewTriggerId = `people-filter-view-${nextId++}`;

	readonly isDesktop = toSignal(this.platformService.isLg, { initialValue: true });

	constructor(private readonly platformService: PlatformService) {
		addIcons({ eyeOutline });
	}
}
