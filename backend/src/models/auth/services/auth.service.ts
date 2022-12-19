import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { validateSync } from "class-validator";
import { Request } from "express";
import { ReqWithUser } from "../schema/req-with-user";
import { UserToken } from "../schema/user-token";

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async parseToken(req: ReqWithUser) {
    const token = req.header("authorization")?.match("/^Bearer (.+)$")?.[1];

    try {
      const tokenData = await this.jwtService.verifyAsync<object>(token, {});

      if (this.validateToken(tokenData)) {
        req.token = token;
        req.user = tokenData;
      }
    } catch (err) {}
  }

  getToken(req: Request) {
    return req["user"];
  }

  private validateToken(tokenData: any): tokenData is UserToken {
    let validateData = Object.assign(new UserToken(), tokenData);

    const validateErrors = validateSync(validateData, { stopAtFirstError: true });

    return validateErrors.length === 0;
  }
}
