import { Global, Module } from "@nestjs/common";
import { AuthService } from "./services/auth.service";

@Global()
@Module({
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
