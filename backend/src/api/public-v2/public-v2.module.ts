import { Module } from "@nestjs/common";
import { AlbumsModelModule } from "src/models/albums/albums-model.module";
import { EventsModelModule } from "src/models/events/events-model.module";
import { FilesModule } from "src/models/files/files.module";
import { MembersModelModule } from "src/models/members/members-model.module";
import { ProgramIcalController } from "./controllers/program-ical.controller";
import { PublicV2Controller } from "./controllers/public-v2.controller";
import { ProgramIcalService } from "./services/program-ical.service";
import { PublicV2Service } from "./services/public-v2.service";

@Module({
	controllers: [PublicV2Controller, ProgramIcalController],
	imports: [EventsModelModule, AlbumsModelModule, MembersModelModule, FilesModule],
	providers: [PublicV2Service, ProgramIcalService],
	exports: [PublicV2Service],
})
export class PublicV2Module {}
