import { Module } from "@nestjs/common";
import { BackupsModelModule } from "src/models/backups/backups-model.module";
import { BackupsController } from "./controllers/backups.controller";

@Module({
	imports: [BackupsModelModule],
	controllers: [BackupsController],
})
export class BackupsModule {}
