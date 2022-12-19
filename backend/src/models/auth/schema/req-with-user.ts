import { Request } from "express";
import { UserToken } from "./user-token";

export type ReqWithUser = Request & { user?: UserToken; token?: string };
