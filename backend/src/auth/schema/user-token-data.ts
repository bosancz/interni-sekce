import { JwtPayload } from "jsonwebtoken";
import { UserData } from "./user-data";

export type UserTokenData = UserData & JwtPayload;
