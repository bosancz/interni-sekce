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
		const { login, email, password, generated } = await this.resolveCredentials();

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
		const envLogin = process.env["ADMIN_LOGIN"];
		const envEmail = process.env["ADMIN_EMAIL"];
		const envPassword = process.env["ADMIN_PASSWORD"];

		if (envLogin && envEmail && envPassword) {
			return { login: envLogin, email: envEmail, password: envPassword, generated: false };
		}

		const readline = createInterface({ input: process.stdin, output: process.stdout });
		const lines = readline[Symbol.asyncIterator]();

		try {
			const login = envLogin || (await this.ask(lines, "Login", "ADMIN_LOGIN"));
			const email = envEmail || (await this.ask(lines, "E-mail", "ADMIN_EMAIL"));
			const { password, generated } = envPassword
				? { password: envPassword, generated: false }
				: await this.askPassword(lines);

			return { login, email, password, generated };
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

	private async askPassword(lines: AsyncIterator<string>) {
		process.stdout.write("Password: ");

		const line = await lines.next();
		const value = line.value?.trim();

		if (value) return { password: value, generated: false };

		if (StaticConfig.production) {
			throw new Error("No password given. Enter one, or set the ADMIN_PASSWORD environment variable.");
		}

		return { password: this.hashService.generateRandomString(18), generated: true };
	}
}
