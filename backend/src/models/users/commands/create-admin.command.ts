import { Logger } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";
import { createInterface } from "readline/promises";
import { HashService } from "src/auth/services/hash.service";
import { StaticConfig } from "src/config";
import { UserRoles } from "../entities/user.entity";
import { UsersRepository } from "../repositories/users.repository";

@Command({
	name: "create-admin",
	arguments: "",
	options: {},
})
export class CreateAdminCommand extends CommandRunner {
	private logger = new Logger(CreateAdminCommand.name);

	constructor(
		private usersService: UsersRepository,
		private hashService: HashService,
	) {
		super();
	}

	async run(): Promise<void> {
		const { login, email } = await this.resolveCredentials();

		let password = process.env["ADMIN_PASSWORD"];
		let generated = false;
		if (!password) {
			if (StaticConfig.production) {
				throw new Error("Set ADMIN_PASSWORD when creating an admin user in production.");
			}
			password = this.hashService.generateRandomString(18);
			generated = true;
		}

		const passwordHash = await this.hashService.generateHash(password);

		const existing = await this.usersService.findUser({ login: login.toLocaleLowerCase() });
		if (existing) {
			await this.usersService.updateUser(existing.id, { password: passwordHash });
			this.logger.log(`Updated password for existing admin user '${login}'.`);
		} else {
			await this.usersService.createUser({
				login,
				email,
				password: passwordHash,
				roles: [UserRoles.admin],
			});
			this.logger.log(`Admin user '${login}' created.`);
		}

		if (generated) this.logger.warn(`Generated password for '${login}': ${password}`);
	}

	private async resolveCredentials() {
		const login = process.env["ADMIN_LOGIN"];
		const email = process.env["ADMIN_EMAIL"];

		if (login && email) return { login, email };

		const readline = createInterface({ input: process.stdin, output: process.stdout });
		const lines = readline[Symbol.asyncIterator]();

		try {
			return {
				login: login || (await this.ask(lines, "Login", "ADMIN_LOGIN")),
				email: email || (await this.ask(lines, "E-mail", "ADMIN_EMAIL")),
			};
		} finally {
			readline.close();
		}
	}

	private async ask(lines: AsyncIterator<string>, label: string, variable: string) {
		process.stdout.write(`${label}: `);

		const line = await lines.next();
		const value = line.value?.trim();

		if (!value) {
			throw new Error(
				`No ${label.toLocaleLowerCase()} given. Enter one, or set the ${variable} environment variable.`,
			);
		}

		return value;
	}
}
