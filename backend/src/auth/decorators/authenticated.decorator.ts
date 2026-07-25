import { applyDecorators, UseGuards } from "@nestjs/common";
import { ApiCookieAuth } from "@nestjs/swagger";
import { UserGuard } from "../guards/user.guard";

/** Name of the OpenAPI security scheme for the session cookie; defined once in `openapi.ts`. */
export const COOKIE_AUTH_SCHEME = "cookieAuth" as const;

/**
 * Require an authenticated session on the decorated controller or route.
 *
 * Combines the two things every logged-in endpoint needs: {@link UserGuard}, which rejects requests
 * without a valid `token` session cookie, and the `cookieAuth` OpenAPI security requirement, so the
 * generated spec (and Swagger UI / SDK) advertises the endpoint as authenticated. Applying both here
 * keeps them from drifting apart. Public endpoints simply omit this decorator.
 */
export function Authenticated() {
	return applyDecorators(UseGuards(UserGuard), ApiCookieAuth(COOKIE_AUTH_SCHEME));
}
