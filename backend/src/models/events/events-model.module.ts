import { Module } from "@nestjs/common";
import { EventsService } from "./services/events.service";

@Module({
  // imports: [TypeOrmModule.forFeature([Event])],
  providers: [EventsService],
})
export class EventsModelModule {}
