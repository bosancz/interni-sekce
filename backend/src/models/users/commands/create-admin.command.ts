import { Logger } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";
import { HashService } from "src/auth/services/hash.service";
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

	async run(inputs: string[], options: Record<string, any>): Promise<void> {
		const userData = {
			login: "bilbo",
			email: "bilbo@bosan.cz",
			password: "gandalf",
		};

		const user = await this.usersService.findUser({ login: userData.login });

		if (user) {
			await this.usersService.deleteUser(user.id);
		}
		const passwordHash = await this.hashService.generateHash(userData.password);
		await this.usersService.createUser({
			login: userData.login,
			password: passwordHash,
			email: userData.email,
			roles: [UserRoles.admin],
		});
		this.logger.warn(`Admin user created with login 'bilbo' and password 'gandalf'`);
	}
}
