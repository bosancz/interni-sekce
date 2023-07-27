import { Module } from "@nestjs/common";
import { FilesService } from "./services/files.service";

@Module({
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
