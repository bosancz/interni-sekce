import { Injectable } from "@nestjs/common";
import { compare, hash } from "bcryptjs";
import { randomBytes } from "crypto";

@Injectable()
export class HashService {
	async generateHash(s: string) {
		return hash(s, 12);
	}

	async compareHash(s: string, hash: string) {
		return compare(s, hash);
	}

	generateRandomString(bytes = 32) {
		return randomBytes(bytes).toString("base64url");
	}
}
