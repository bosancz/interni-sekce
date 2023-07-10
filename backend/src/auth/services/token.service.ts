import { Injectable } from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { validateSync } from "class-validator";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { UserTokenData } from "../schema/user-token";

@Injectable()
export class TokenService {
  private readonly cookieName = "token";

  constructor(private jwtService: JwtService) {}

  async parseToken(req: Request) {
    const tokenString = req.cookies?.[this.cookieName];
    if (!tokenString) return;

    try {
      const tokenData = await this.jwtService.verifyAsync<JwtPayload>(tokenString, {});

      if (this.validateToken(tokenData)) {
        req.token = tokenString;
        req.user = tokenData;
      }
    } catch (err) {}
  }

  getToken(req: Request) {
    return req["user"];
  }

  async createToken(tokenData: UserTokenData, options: JwtSignOptions = {}) {
    return this.jwtService.signAsync(tokenData, { expiresIn: "30d", ...options });
  }

  async setToken(res: Response, tokenData: UserTokenData) {
    const token = await this.createToken(tokenData);

    res.cookie(this.cookieName, token);
  }

  clearToken(res: Response) {
    res.clearCookie(this.cookieName);
  }

  private validateToken(tokenData: JwtPayload): tokenData is UserTokenData & JwtPayload {
    let validateData = Object.assign(new UserTokenData(), tokenData);

    const validateErrors = validateSync(validateData, { stopAtFirstError: true });

    return validateErrors.length === 0;
  }
}
