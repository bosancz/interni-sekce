import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { UsersRepository } from "./repositories/users.repository";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModelModule {}
