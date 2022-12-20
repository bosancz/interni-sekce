import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Event } from "src/models/events/entities/event.entity";
import { EventsModelModule } from "src/models/events/events-model.module";
import { EventsController } from "./controllers/events.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Event]), EventsModelModule],
  controllers: [EventsController],
})
export class EventsModule {}
