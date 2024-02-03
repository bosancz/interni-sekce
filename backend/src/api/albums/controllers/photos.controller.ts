import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { PhotosRepository } from "src/models/albums/repositories/photos.repository";
import {
  PhotoCreateRoute,
  PhotoDeleteRoute,
  PhotoEditRoute,
  PhotoReadFileRoute,
  PhotoReadRoute,
  PhotosListRoute,
} from "../acl/photo.acl";
import { PhotoCreateBody, PhotoResponse, PhotoSizes, PhotoUpdateBody } from "../dto/photo.dto";

@Controller("photos")
@AcController()
@ApiTags("Photo gallery")
export class PhotosController {
  constructor(private photos: PhotosRepository) {}

  @Get()
  @AcLinks(PhotosListRoute)
  @ApiResponse({ type: WithLinks(PhotoResponse), isArray: true })
  async listPhotos(@Req() req: Request) {
    return this.photos.getPhotos();
  }

  @Post()
  @AcLinks(PhotoCreateRoute)
  @UseInterceptors(FileInterceptor("file"))
  @ApiBody({ type: PhotoCreateBody })
  createPhoto(@UploadedFile() file: Express.Multer.File, @Body() body: PhotoCreateBody) {
    //TODO:
  }

  @Get(":id")
  @AcLinks(PhotoReadRoute)
  @ApiResponse({ type: WithLinks(PhotoResponse) })
  async getPhoto(@Param("id") id: number, @Req() req: Request) {
    const photo = await this.photos.getPhoto(id);
    if (!photo) throw new NotFoundException();

    PhotoReadRoute.canOrThrow(req, photo);

    return photo;
  }

  @Patch(":id")
  @AcLinks(PhotoEditRoute)
  @ApiResponse({ status: 204 })
  async updatePhoto(@Param("id") id: number, @Req() req: Request, @Body() body: PhotoUpdateBody): Promise<void> {
    const photo = await this.photos.getPhoto(id);
    if (!photo) throw new NotFoundException();

    PhotoEditRoute.canOrThrow(req, photo);

    await this.photos.updatePhoto(photo.id, body);
  }

  @Delete(":id")
  @AcLinks(PhotoDeleteRoute)
  @ApiResponse({ status: 204 })
  async deletePhoto(@Param("id") id: number, @Req() req: Request): Promise<void> {
    const photo = await this.photos.getPhoto(id);
    if (!photo) throw new NotFoundException();

    PhotoEditRoute.canOrThrow(req, photo);

    await this.photos.deletePhoto(photo.id);
  }

  @Get(":id/image/:size")
  @AcLinks(PhotoReadFileRoute)
  async getPhotoImage(@Param("id") id: number, @Param("size") size: PhotoSizes, @Req() req: Request): Promise<void> {
    const photo = await this.photos.getPhoto(id);
    if (!photo) throw new NotFoundException();

    PhotoReadFileRoute.canOrThrow(req, photo);

    //TODO: return photo file
  }
}
