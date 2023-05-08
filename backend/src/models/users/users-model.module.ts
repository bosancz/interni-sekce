import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreateAdminCommand } from "./commands/create-admin.command";
import { User } from "./entities/user.entity";
import { UsersService } from "./services/users.service";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, CreateAdminCommand],
  exports: [UsersService],
})
export class UsersModelModule {}
