import { Module } from "@nestjs/common";
import { EventsModelModule } from "src/models/events/events-model.module";
import { EventsController } from "./controllers/events.controller";

@Module({
  // imports: [TypeOrmModule.forFeature([Event])],
  controllers: [EventsController],
  imports: [EventsModelModule],
})
export class EventsModule {}
