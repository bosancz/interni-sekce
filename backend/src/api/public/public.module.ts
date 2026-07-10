import { Module } from "@nestjs/common";
import { AlbumsModelModule } from "src/models/albums/albums-model.module";
import { EventsModelModule } from "src/models/events/events-model.module";
import { FilesModule } from "src/models/files/files.module";
import { MembersModelModule } from "src/models/members/members-model.module";
import { PublicController } from "./controllers/public.controller";
import { PublicService } from "./services/public.service";

@Module({
	controllers: [PublicController],
	imports: [EventsModelModule, AlbumsModelModule, MembersModelModule, FilesModule],
	providers: [PublicService],
})
export class PublicModule {}
