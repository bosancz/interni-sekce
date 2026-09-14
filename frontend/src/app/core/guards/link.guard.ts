import { inject } from "@angular/core";
import { CanMatchFn, Router } from "@angular/router";
import { map, take } from "rxjs";

import { SDK } from "src/sdk";

import { ApiService } from "../services/api.service";

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
