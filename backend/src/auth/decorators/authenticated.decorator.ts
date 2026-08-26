import { applyDecorators, UseGuards } from "@nestjs/common";
import { ApiCookieAuth } from "@nestjs/swagger";
import { UserGuard } from "../guards/user.guard";

export const COOKIE_AUTH_SCHEME = "cookieAuth" as const;

export function Authenticated() {
	return applyDecorators(UseGuards(UserGuard), ApiCookieAuth(COOKIE_AUTH_SCHEME));
}
