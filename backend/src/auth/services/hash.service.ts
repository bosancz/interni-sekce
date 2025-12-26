import { Injectable } from "@nestjs/common";
import { compare, hash } from "bcryptjs";

@Injectable()
export class HashService {
	async generateHash(s: string) {
		return hash(s, 12);
	}

	async compareHash(s: string, hash: string) {
		return compare(s, hash);
	}

	generateRandomString() {
		return Math.random().toString(36).slice(2);
	}
}
