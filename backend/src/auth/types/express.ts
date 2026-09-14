import { SessionUser } from "../schema/user-token";

export {};

declare global {
	namespace Express {
		export interface Request {
			user?: SessionUser;
			token?: string;
		}
	}
}
