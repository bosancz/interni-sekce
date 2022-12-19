import { Module } from "@nestjs/common";
import { EventsModelModule } from "src/models/events/events-model.module";
import { PublicController } from "./controllers/public.controller";

@Module({
  controllers: [PublicController],
  imports: [EventsModelModule],
})
export class PublicModule {}
