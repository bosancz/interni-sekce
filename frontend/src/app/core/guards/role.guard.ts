import { inject } from "@angular/core";
import { CanMatchFn, Router } from "@angular/router";
import { filter, map, take } from "rxjs";

import { SDK } from "src/sdk";

import { hasUserRole, UserService } from "../services/user.service";

export function roleGuard(...roles: SDK.UserRolesEnum[]): CanMatchFn {
	return () => {
		const userService = inject(UserService);
		const router = inject(Router);

		return userService.user.pipe(
			filter((user) => user !== undefined),
			take(1),
			map((user) => hasUserRole(user?.roles ?? [], roles)),
			map((allowed) => allowed || router.createUrlTree(["/"])),
		);
	};
}
