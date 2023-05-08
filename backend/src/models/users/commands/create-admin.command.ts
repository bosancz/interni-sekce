import { Command, CommandRunner } from "nest-commander";
import { HashService } from "src/auth/services/hash.service";
import { UserRoles } from "../entities/user.entity";
import { UsersService } from "../services/users.service";

@Command({
  name: "create-admin",
  arguments: "",
  options: {},
})
export class CreateAdminCommand extends CommandRunner {
  constructor(private usersService: UsersService, private hashService: HashService) {
    super();
  }

  async run(inputs: string[], options: Record<string, any>): Promise<void> {
    const user = await this.usersService.getUserByLogin("admin");
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
    console.warn("Created user 'admin' with password 'admin'");
  }
}
