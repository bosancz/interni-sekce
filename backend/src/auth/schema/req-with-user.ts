import { Request } from "express";
import { UserData } from "./user-data";

export type ReqWithUser = Request & { user?: UserData; token?: string };
