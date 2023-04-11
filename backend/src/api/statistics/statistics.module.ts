import { Module } from "@nestjs/common";
import { StatisticsModelModule } from "src/models/statistics/statistics-model.module";
import { PaddlersController } from "./controllers/paddlers.controller";

@Module({
  controllers: [PaddlersController],
  imports: [StatisticsModelModule],
})
export class StatisticsModule {}
