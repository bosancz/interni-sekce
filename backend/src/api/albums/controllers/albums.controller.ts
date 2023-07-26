import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { AlbumStatus } from "src/models/albums/entities/album.entity";
import { AlbumsService } from "src/models/albums/services/albums.service";
import { PhotosService } from "src/models/albums/services/photos.service";
import {
  AlbumCreateRoute,
  AlbumDeleteRoute,
  AlbumEditRoute,
  AlbumPhotosRoute,
  AlbumPublishRoute,
  AlbumReadRoute,
  AlbumUnpublishRoute,
  AlbumsListRoute,
} from "../acl/albums.acl";
import { AlbumCreateBody, AlbumResponse, AlbumUpdateBody } from "../dto/album.dto";
import { PhotoResponse } from "../dto/photo.dto";

@Controller("albums")
@AcController()
@ApiTags("Photo gallery")
export class AlbumsController {
  constructor(private albumsService: AlbumsService, private photosService: PhotosService) {}

  @Get()
  @AcLinks(AlbumsListRoute)
  @ApiResponse({ type: WithLinks(AlbumResponse), isArray: true })
  async listAlbums(@Req() req: Request): Promise<AlbumResponse[]> {
    return await this.albumsService.repository
      .createQueryBuilder("albums")
      .select(["albums.id", "albums.name", "albums.status", "albums.dateFrom", "albums.dateTill"])
      .where(AlbumsListRoute.canWhere(req))
      .getRawMany<AlbumResponse>();
  }

  @Post()
  @AcLinks(AlbumCreateRoute)
  @ApiResponse({ type: WithLinks(AlbumResponse) })
  async createAlbum(@Req() req: Request, @Body() body: AlbumCreateBody): Promise<AlbumResponse> {
    AlbumCreateRoute.canOrThrow(req, undefined);

    return this.albumsService.createAlbum(body);
  }

  @Get(":id")
  @AcLinks(AlbumReadRoute)
  @ApiResponse({ type: WithLinks(AlbumResponse) })
  async getAlbum(@Param("id") id: number, @Req() req: Request): Promise<AlbumResponse> {
    const album = await this.albumsService.repository.findOneBy({ id });

    if (!album) throw new NotFoundException();

    AlbumReadRoute.canOrThrow(req, album);

    return album;
  }

  @Patch(":id")
  @AcLinks(AlbumEditRoute)
  @ApiResponse({ status: 204 })
  async updateAlbum(@Param("id") id: number, @Req() req: Request, @Body() body: AlbumUpdateBody): Promise<void> {
    const album = await this.albumsService.repository.findOneBy({ id });

    if (!album) throw new NotFoundException();

    AlbumEditRoute.canOrThrow(req, album);

    await this.albumsService.updateAlbum(album.id, body);
  }

  @Delete(":id")
  @AcLinks(AlbumDeleteRoute)
  @ApiResponse({ status: 204 })
  async deleteAlbum(@Param("id") id: number, @Req() req: Request): Promise<void> {
    const album = await this.albumsService.repository.findOneBy({ id });
    if (!album) throw new NotFoundException();

    AlbumDeleteRoute.canOrThrow(req, album);

    await this.albumsService.deleteAlbum(id);
  }

  @Post(":id/publish")
  @AcLinks(AlbumPublishRoute)
  @ApiResponse({ status: 204 })
  async publishAlbum(@Param("id") id: number, @Req() req: Request): Promise<void> {
    const album = await this.albumsService.repository.findOneBy({ id });
    if (!album) throw new NotFoundException();

    AlbumPublishRoute.canOrThrow(req, album);

    await this.albumsService.updateAlbum(id, { status: AlbumStatus.public });
  }

  @Post(":id/unpublish")
  @AcLinks(AlbumUnpublishRoute)
  @ApiResponse({ status: 204 })
  async unpublishAlbum(@Param("id") id: number, @Req() req: Request): Promise<void> {
    const album = await this.albumsService.repository.findOneBy({ id });
    if (!album) throw new NotFoundException();

    AlbumUnpublishRoute.canOrThrow(req, album);

    await this.albumsService.updateAlbum(id, { status: AlbumStatus.draft });
  }

  @Get(":id/photos")
  @AcLinks(AlbumPhotosRoute)
  @ApiResponse({ type: WithLinks(PhotoResponse), isArray: true })
  async getAlbumPhotos(@Param("id") id: number, @Req() req: Request): Promise<PhotoResponse[]> {
    const photos = this.photosService.repository
      .createQueryBuilder("photos")
      .where("photos.albumId = :albumId", { albumId: id })
      .andWhere(AlbumPhotosRoute.canWhere(req));

    return photos.getMany();
  }
}
