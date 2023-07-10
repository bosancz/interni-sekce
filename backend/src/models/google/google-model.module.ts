import { Module } from "@nestjs/common";
import { GoogleService } from "./services/google.service";

@Module({
  providers: [GoogleService],
  exports: [GoogleService],
})
export class GoogleModelModule {}
