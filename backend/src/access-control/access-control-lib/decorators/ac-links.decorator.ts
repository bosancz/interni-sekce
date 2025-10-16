import { applyDecorators, RequestMethod, SetMetadata, UseInterceptors } from "@nestjs/common";
import { AcLinksInterceptor } from "../interceptors/ac-links.interceptor";
import { OptionsStore } from "../options-store";
import { RouteStore } from "../route-store";
import { AcPermission } from "../schema/ac-route-acl";
import { MetadataConstant } from "../schema/metadata-constant";
import { RouteStoreItem } from "../schema/route-store-item";

/**
 * Adds field (default: `_links`) to response documents based on Access Control permissions
 * @param entity Access Control List entity
 * @param options Options for field generation
 * @returns
 */
export function AcLinks(acl: AcPermission<any>): MethodDecorator {
	return (target: any, method: string | symbol, descriptor: PropertyDescriptor) => {
		const controller = target;
		const handler = descriptor.value;

		const methodId = Reflect.getMetadata("method", handler);
		const httpMethod = <"GET" | "POST" | "PUT" | "PATCH" | "DELETE">RequestMethod[methodId];

		const name = acl.options.name
			? acl.options.name
			: OptionsStore.routeNameConvention
				? OptionsStore.routeNameConvention(String(method))
				: String(method);

		const routeStoreItem: RouteStoreItem = {
			acl,
			method,
			controller,
			handler,
			httpMethod,
			name,
		};

		RouteStore.push(routeStoreItem);

		const decorators: MethodDecorator[] = [
			SetMetadata(MetadataConstant.route, routeStoreItem),
			UseInterceptors(AcLinksInterceptor),
		];

		// if (acl.options.contains) decorators.push(ApiResponse({ type: WithLinks(acl.options.contains) }));

		return applyDecorators(...decorators)(target, method, descriptor);
	};
}
