import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/models/users/entities/user.entity";
import { UsersModelModule } from "src/models/users/users-model.module";
import { UsersController } from "./controllers/users.controller";

@Module({
	imports: [TypeOrmModule.forFeature([User]), UsersModelModule],
	controllers: [UsersController],
})
export class UsersModule {}
