import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

@Injectable()
export class TokenMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  use(req: Request, res: Response, next: () => void) {
    this.authService.parseToken(req);
    next();
  }
}
