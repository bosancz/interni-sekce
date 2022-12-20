import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { validateSync } from "class-validator";
import { ReqWithUser } from "../schema/req-with-user";
import { UserData } from "../schema/user-data";

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async parseToken(req: ReqWithUser) {
    const token = req.header("authorization")?.match("/^Bearer (.+)$")?.[1];

    if (!token) return;

    try {
      const tokenData = await this.jwtService.verifyAsync<object>(token, {});

      if (this.validateToken(tokenData)) {
        req.token = token;
        req.user = tokenData;
      }
    } catch (err) {}
  }

  getToken(req: ReqWithUser) {
    return req["user"];
  }

  private validateToken(tokenData: any): tokenData is UserData {
    let validateData = Object.assign(new UserData(), tokenData);

    const validateErrors = validateSync(validateData, { stopAtFirstError: true });

    return validateErrors.length === 0;
  }
}
