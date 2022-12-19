import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/models/database/database.module";
import { EventsController } from "./controllers/events.controller";

@Module({
  // imports: [TypeOrmModule.forFeature([Event])],
  controllers: [EventsController],
  imports: [DatabaseModule],
})
export class EventsModule {}
