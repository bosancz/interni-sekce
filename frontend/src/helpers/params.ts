import { Params } from "@angular/router";

export function getParamsKey(params: Params): string {
	return JSON.stringify(
		Object.keys(params)
			.sort()
			.map((key) => [key, params[key]]),
	);
}
