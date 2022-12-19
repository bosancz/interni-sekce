import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/models/database/database.module";
import { PublicController } from "./controllers/public.controller";

@Module({
  controllers: [PublicController],
  imports: [DatabaseModule],
})
export class PublicModule {}
