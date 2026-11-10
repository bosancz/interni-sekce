import { Component, input, output } from "@angular/core";
import { addIcons } from "ionicons";
import { FilterPillComponent, FilterPillOption } from "src/app/shared/components/filter-pill/filter-pill.component";

const COLUMNS_ICON =
	"data:image/svg+xml;utf8," +
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
	'<rect x="64" y="80" width="384" height="352" rx="24" fill="none" stroke="currentColor" stroke-width="32"/>' +
	'<line x1="192" y1="80" x2="192" y2="432" stroke="currentColor" stroke-width="32"/>' +
	'<line x1="320" y1="80" x2="320" y2="432" stroke="currentColor" stroke-width="32"/></svg>';

@Component({
	selector: "bo-columns-select",
	template: `<bo-filter-pill
		label="Sloupce"
		icon="columns"
		[options]="options()"
		[selected]="selected()"
		[columns]="2"
		(selectedChange)="selectedChange.emit($event)"
	/>`,
	imports: [FilterPillComponent],
})
export class ColumnsSelectComponent {
	options = input<FilterPillOption[]>([]);
	selected = input<string[]>([]);
	selectedChange = output<string[]>();

	constructor() {
		addIcons({ columns: COLUMNS_ICON });
	}
}
