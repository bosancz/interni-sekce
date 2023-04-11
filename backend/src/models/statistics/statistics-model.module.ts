import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Event } from "../events/entities/event.entity";
import { Member } from "../members/entities/member.entity";
import { PaddlersStatisticsService } from "./services/paddlers-statistics.service";

@Module({
  providers: [PaddlersStatisticsService],
  imports: [TypeOrmModule.forFeature([Member, Event])],
  exports: [PaddlersStatisticsService],
})
export class StatisticsModelModule {}
