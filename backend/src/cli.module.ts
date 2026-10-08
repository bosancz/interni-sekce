import { Module } from "@nestjs/common";
import { ConfigModule } from "./config";
import { DbRefreshVersionsCommand } from "./database/commands/db-refresh-versions.command";
import { DatabaseModule } from "./database/database.module";
import { AlbumsModelModule } from "./models/albums/albums-model.module";
import { UsersModelModule } from "./models/users/users-model.module";
import { MongoImportModule } from "./mongo-import/mongo-import.module";
import { WorkerModelModule } from "./models/worker/worker-model.module";
import { SeedModule } from "./seed/seed.module";

@Module({
	imports: [
		DatabaseModule,
		ConfigModule,
		MongoImportModule,
		SeedModule,
		UsersModelModule,
		AlbumsModelModule,
		WorkerModelModule.forRoot({ processors: false }),
	],
	providers: [DbRefreshVersionsCommand],
})
export class CliModule {}
