import { Logger } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";
import { HashService } from "src/auth/services/hash.service";
import { UserRoles } from "../../models/users/entities/user.entity";
import { UsersRepository } from "../../models/users/repositories/users.repository";

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
    const user = await this.usersService.findUser({ login: "admin" });
    if (user) {
      await this.usersService.deleteUser(user.id);
    }
    const passwordHash = await this.hashService.generateHash("admin");
    await this.usersService.createUser({
      login: "admin",
      password: passwordHash,
      email: "admin@bosan.cz",
      roles: [UserRoles.admin],
    });
    this.logger.warn("Created user 'admin' with password 'admin'");
  }
}
