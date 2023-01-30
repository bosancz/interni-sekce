import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/access-control-lib/decorators/ac-links.decorator";
import { AlbumsService } from "src/models/albums/services/albums.service";
import { AlbumDeleteRoute, AlbumEditRoute, AlbumReadRoute, AlbumsListRoute } from "../acl/albums.acl";
import { AlbumEditBody, AlbumResponse, AlbumsListResponse } from "../dto/album.dto";

@Controller("albums")
@AcController()
@ApiTags("Photo gallery")
export class AlbumsController {
  constructor(private albumsService: AlbumsService) {}

  @Get()
  @AcLinks(AlbumsListRoute)
  @ApiResponse({ type: AlbumsListResponse, isArray: true })
  async albumsList(@Req() req: Request) {
    return await this.albumsService.repository
      .createQueryBuilder("albums")
      .select(["albums.id", "albums.name", "albums.status"])
      .where(AlbumsListRoute.canWhere(req))
      .getMany();
  }

  @Get(":id")
  @AcLinks(AlbumReadRoute)
  @ApiResponse({ type: AlbumResponse })
  async albumRead(@Param("id") id: number, @Req() req: Request) {
    const album = await this.albumsService.repository.findOneBy({ id });

    if (!album) throw new NotFoundException();

    AlbumReadRoute.canOrThrow(req, album);

    return album;
  }

  @Patch(":id")
  @AcLinks(AlbumEditRoute)
  @ApiResponse({ status: 204 })
  async albumEdit(@Param("id") id: number, @Req() req: Request, @Body() body: AlbumEditBody): Promise<void> {
    const album = await this.albumsService.repository.findOneBy({ id });

    if (!album) throw new NotFoundException();

    AlbumEditRoute.canOrThrow(req, album);

    await this.albumsService.updateAlbum(album.id, body);
  }

  @Delete(":id")
  @AcLinks(AlbumDeleteRoute)
  @ApiResponse({ status: 204 })
  async albumDelete(@Param("id") id: number, @Req() req: Request): Promise<void> {
    const album = await this.albumsService.repository.findOneBy({ id });
    if (!album) throw new NotFoundException();

    AlbumDeleteRoute.canOrThrow(req, album);

    await this.albumsService.deleteAlbum(id);
  }
}
