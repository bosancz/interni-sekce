import { Injectable } from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class AuthService {
  getToken(req: Request) {
    return req["user"];
  }
}
