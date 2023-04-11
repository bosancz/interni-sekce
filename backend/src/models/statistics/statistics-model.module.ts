import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Event } from "../events/entities/event.entity";
import { Member } from "../members/entities/member.entity";
import { StatisticsService } from "./services/statistics.service";

@Module({
  providers: [StatisticsService],
  imports: [TypeOrmModule.forFeature([Member, Event])],
  exports: [StatisticsService],
})
export class StatisticsModelModule {}
