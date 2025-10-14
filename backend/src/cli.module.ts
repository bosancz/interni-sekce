import { Module } from "@nestjs/common";
import { ConfigModule } from "./config";
import { DatabaseModule } from "./database/database.module";
import { AlbumsModelModule } from "./models/albums/albums-model.module";
import { UsersModelModule } from "./models/users/users-model.module";
import { MongoImportModule } from "./mongo-import/mongo-import.module";

@Module({
	imports: [DatabaseModule, ConfigModule, MongoImportModule, UsersModelModule, AlbumsModelModule],
	providers: [],
})
export class CliModule {}
