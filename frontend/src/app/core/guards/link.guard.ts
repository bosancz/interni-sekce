import { inject } from "@angular/core";
import { CanMatchFn, Router } from "@angular/router";
import { map, take } from "rxjs";

import { SDK } from "src/sdk";

import { ApiService } from "../services/api.service";

/**
 * Route guard factory gating a route on the API root `_links`. Access is granted when at least one
 * of the given links is `allowed` for the current user (as computed by the backend), otherwise the
 * user is redirected to the home page. This closes the hole where admin-only pages were reachable
 * by typing their URL — the backend `_links` are the single source of truth for what is permitted.
 *
 * @example canMatch: [linkGuard("listUsers", "listEvents")]
 */
export function linkGuard(...links: (keyof SDK.RootResponseLinks)[]): CanMatchFn {
	return () => {
		const api = inject(ApiService);
		const router = inject(Router);

		return api.rootLinks.pipe(
			take(1),
			map((rootLinks) => links.some((link) => rootLinks[link]?.allowed)),
			map((allowed) => allowed || router.createUrlTree(["/"])),
		);
	};
}
