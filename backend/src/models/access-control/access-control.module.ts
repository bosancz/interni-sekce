import { Global, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AccessControlService } from "./services/access-control.service";

@Global()
@Module({
  imports: [AuthModule],
  providers: [AccessControlService],
  exports: [AccessControlService],
})
export class AccessControlModule {}
