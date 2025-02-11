import { Module } from "@nestjs/common";
import { ConfigModule } from "./config";
import { DatabaseModule } from "./database/database.module";

@Module({
	imports: [DatabaseModule, ConfigModule],
	controllers: [],
	providers: [],
})
export class AppModule {}
