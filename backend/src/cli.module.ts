import { Module } from "@nestjs/common";
import { ConfigModule } from "./config";
import { DatabaseModule } from "./database/database.module";
import { MongoImportModule } from "./mongo-import/mongo-import.module";

@Module({
	imports: [DatabaseModule, ConfigModule, MongoImportModule],
	providers: [],
})
export class CliModule {}
