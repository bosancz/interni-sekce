import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { AccessControlService } from "src/access-control/access-control-lib/services/access-control.service";
import { AlbumsService } from "src/models/albums/services/albums.service";

@Controller("albums")
@AcController()
@ApiTags("Photo gallery")
export class AlbumsController {
  constructor(private albumsService: AlbumsService, private acService: AccessControlService) {}

  @Get()
  async getAlbums() {
    // const where = this.acService.filter<Album>("album");
    // const albums = this.albumsService.find
    // return albums;
  }
}
