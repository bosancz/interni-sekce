import { Injectable } from "@angular/core";
import { OpenApiAxios } from "@web-bee-ru/openapi-axios";
import { OptionsType, ValidStatusType } from "@web-bee-ru/openapi-axios/dist/src/types/options";
import { GetApiResponse } from "@web-bee-ru/openapi-axios/dist/src/types/response";
import {
	RouteResponsesByStatusCode,
	RoutesForMethod,
	SchemaType,
	SchemeRouteField,
} from "@web-bee-ru/openapi-axios/dist/src/types/schemeTypes";
import { FilterKeyOrNever, IsNullable, NotNever } from "@web-bee-ru/openapi-axios/dist/src/types/utils";
import axios from "axios";
import { filter, fromEvent, Observable, retry, Subject, switchMap } from "rxjs";

const axiosClient = axios.create({
	baseURL: "/api",
	adapter: "fetch", // strongly recommended (available since axios@1.7.0)
});

interface WatchRequestOptions {
	maxRetries?: number;
	onFocus?: boolean;
}

@Injectable()
export class ApiClient<Schema extends SchemaType> extends OpenApiAxios<Schema, "axios"> {
	private tabFocusEvent = fromEvent(document, "visibilitychange").pipe(
		filter(() => document.visibilityState === "visible"),
	);
	private reloadApiEvent = new Subject<void>();

	constructor() {
		super(axiosClient, { validStatus: "axios" });
	}

	watch<
		Route extends RoutesForMethod<Schema, "get">,
		MethodValidStatus extends ValidStatusType | undefined = undefined,
	>(
		...args: NotNever<
			FilterKeyOrNever<SchemeRouteField<Schema, "get", Route, "parameters">, "query">
		> extends infer T
			? T extends NotNever<FilterKeyOrNever<SchemeRouteField<Schema, "get", Route, "parameters">, "query">>
				? T extends true
					? [
							path: Route,
							options: OptionsType<Schema, "get", Route, MethodValidStatus> & {
								watchOptions?: WatchRequestOptions;
							},
						]
					: [
							path: Route,
							options?:
								| (OptionsType<Schema, "get", Route, MethodValidStatus> & {
										watchOptions?: WatchRequestOptions;
								  })
								| undefined,
						]
				: never
			: never
	): Observable<
		GetApiResponse<
			IsNullable<MethodValidStatus> extends true ? "axios" : NonNullable<MethodValidStatus>,
			RouteResponsesByStatusCode<Schema, "get", Route, SchemeRouteField<Schema, "get", Route, "responses">>
		>
	> {
		const path = args[0];
		const options = args[1];

		const trigger = new Subject<void>();

		if (options?.watchOptions?.onFocus !== false) this.tabFocusEvent.subscribe(() => trigger.next());
		this.reloadApiEvent.subscribe(() => trigger.next());

		return trigger
			.pipe(
				switchMap(() => {
					const controller = new AbortController();
					trigger.subscribe(() => controller.abort());
					return this.get(...args);
				}),
			)
			.pipe(retry(options?.watchOptions?.maxRetries));
	}
}
