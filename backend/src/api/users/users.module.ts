import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationsModelModule } from "src/models/notifications/notifications-model.module";
import { User } from "src/models/users/entities/user.entity";
import { UsersModelModule } from "src/models/users/users-model.module";
import { UsersController } from "./controllers/users.controller";

@Module({
	imports: [TypeOrmModule.forFeature([User]), UsersModelModule, NotificationsModelModule],
	controllers: [UsersController],
})
export class UsersModule {}
