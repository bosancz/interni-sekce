import { Component, computed, input, output } from "@angular/core";
import { NzTableModule } from "ng-zorro-antd/table";
import { CommonModule } from "@angular/common";

@Component({
	selector: "admin-table",
	templateUrl: "./admin-table.component.html",
	styleUrls: ["./admin-table.component.scss"],
	standalone: true,
	imports: [NzTableModule, CommonModule],
})
export class AdminTableComponent {
	// Input for custom CSS classes
	class = input<string>("");

	// Pagination settings
	pageSize = input<number>(20);
	pageIndex = input<number>(1);
	showPagination = input<boolean>(false);
	pageSizeOptions = input<number[]>([10, 20, 50, 100]);

	// Pagination events
	pageIndexChange = output<number>();
	pageSizeChange = output<number>();

	// Virtual scroll settings
	enableVirtualScroll = input<boolean>(false);
	virtualItemSize = input<number>(54);
	virtualMaxBufferPx = input<number>(400);
	virtualMinBufferPx = input<number>(200);

	// Scroll settings
	scrollX = input<string | null>(null);
	scrollY = input<string | null>("500px");

	// Computed class names
	tableClass = computed(() => {
		const baseClasses = "admin-table";
		const customClasses = this.class();
		return customClasses ? `${baseClasses} ${customClasses}` : baseClasses;
	});

	// Compute scroll configuration
	scrollConfig = computed(() => {
		const config: { x?: string | null; y?: string | null } = {};
		const scrollX = this.scrollX();
		const scrollY = this.scrollY();

		if (scrollX) config.x = scrollX;
		if (scrollY) config.y = scrollY;

		return Object.keys(config).length > 0 ? config : {};
	});

	// Handle pagination changes
	onPageIndexChange(index: number): void {
		this.pageIndexChange.emit(index);
	}

	onPageSizeChange(size: number): void {
		this.pageSizeChange.emit(size);
	}
}
