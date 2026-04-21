import { Component, computed, input } from "@angular/core";
import { NzTableModule } from "ng-zorro-antd/table";
import { CommonModule } from "@angular/common";

@Component({
	selector: "admin-table",
	templateUrl: "./admin-table.component.html",
	styleUrls: ["./admin-table.component.scss"],
	standalone: true,
	imports: [NzTableModule, CommonModule],
})
export class AdminTableComponent<T = any> {
	// Input for custom CSS classes
	class = input<string>("");

	// Input for data source
	data = input<readonly T[]>([]);

	// Input for loading state
	loading = input<boolean>(false);

	// Pagination settings
	pageSize = input<number>(10);
	pageIndex = input<number>(1);
	showPagination = input<boolean>(true);

	// Virtual scroll settings
	virtualScroll = input<boolean>(false);
	virtualItemSize = input<number>(54);
	virtualMaxBufferPx = input<number>(200);
	virtualMinBufferPx = input<number>(100);

	// Scroll settings
	scrollX = input<string | null>(null);
	scrollY = input<string | null>(null);

	// Computed class names
	tableClass = computed(() => {
		const baseClasses = "admin-table";
		const customClasses = this.class();
		return customClasses ? `${baseClasses} ${customClasses}` : baseClasses;
	});

	// Compute scroll configuration for virtual scroll or regular scroll
	scrollConfig = computed(() => {
		const config: { x?: string | null; y?: string | null } = {};
		const scrollX = this.scrollX();
		const scrollY = this.scrollY();

		if (scrollX) config.x = scrollX;
		if (scrollY) config.y = scrollY;

		return Object.keys(config).length > 0 ? config : undefined;
	});

	// Compute virtual scroll configuration
	virtualScrollConfig = computed(() => {
		if (!this.virtualScroll()) {
			return null;
		}
		return {
			itemSize: this.virtualItemSize(),
			maxBufferPx: this.virtualMaxBufferPx(),
			minBufferPx: this.virtualMinBufferPx(),
		};
	});
}
