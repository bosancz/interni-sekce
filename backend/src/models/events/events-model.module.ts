import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventAttendee } from "./entities/event-attendee.entity";
import { EventExpense } from "./entities/event-expense.entity";
import { EventGroup } from "./entities/event-group.entity";
import { Event } from "./entities/event.entity";
import { EventsRepository } from "./repositories/events.repository";

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventGroup, EventExpense, EventAttendee])],
  providers: [EventsRepository],
  exports: [EventsRepository],
})
export class EventsModelModule {}
