import { Params } from "@angular/router";

export type ListLoadMode = "reset" | "more" | "refresh";

export function getParamsKey(params: Params): string {
	return JSON.stringify(
		Object.keys(params)
			.sort()
			.map((key) => [key, params[key]]),
	);
}

export function getPagesToLoad(mode: ListLoadMode, page: number): number[] {
	return mode === "refresh" ? Array.from({ length: page }, (_, i) => i + 1) : [page];
}
