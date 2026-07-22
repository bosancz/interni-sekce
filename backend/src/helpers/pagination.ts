import { SortOptions } from "./sort";

export interface PaginationOptions extends SortOptions {
	limit?: number;
	offset?: number;
}
