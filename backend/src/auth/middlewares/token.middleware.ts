import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response } from "express";
import { TokenService } from "../services/token.service";

@Injectable()
export class TokenMiddleware implements NestMiddleware {
	constructor(private tokenService: TokenService) {}

	async use(req: Request, res: Response, next: () => void) {
		await this.tokenService.loadSession(req, res);
		next();
	}
}
