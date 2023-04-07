import { Module } from "@nestjs/common";
import { UsersModelModule } from "src/models/users/users-model.module";
import { AccountController } from "./controllers/account.controller";
import { LoginController } from './controllers/login.controller';

@Module({
  controllers: [AccountController, LoginController],
  imports: [UsersModelModule],
})
export class AccountModule {}
