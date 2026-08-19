import { Logger } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";
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
		const login = process.env["ADMIN_LOGIN"];
		const email = process.env["ADMIN_EMAIL"];

		if (!login || !email) {
			throw new Error("Set ADMIN_LOGIN and ADMIN_EMAIL environment variables to create an admin user.");
		}

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
}
