import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { SessionUser } from "../schema/user-token";

export const AuthUser = createParamDecorator((data: unknown, ctx: ExecutionContext): SessionUser | undefined => {
	const request = ctx.switchToHttp().getRequest<Request>();
	return request.user;
});
