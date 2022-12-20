import { Module } from "@nestjs/common";
import { AlbumsModelModule } from "src/models/albums/albums-model.module";
import { AlbumsController } from "./controllers/albums.controller";

@Module({
  imports: [AlbumsModelModule],
  controllers: [AlbumsController],
})
export class AlbumsModule {}
