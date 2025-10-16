import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class UserGuard implements CanActivate {
	async canActivate(context: ExecutionContext) {
		const req: Request = context.switchToHttp().getRequest();

		return !!req.user;
	}
}
