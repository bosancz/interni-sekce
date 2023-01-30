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
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/access-control-lib/decorators/ac-links.decorator";
import { PhotosService } from "src/models/albums/services/photos.service";
import { PhotoCreateRoute, PhotoDeleteRoute, PhotoEditRoute, PhotoReadRoute, PhotosListRoute } from "../acl/photo.acl";
import { PhotoEditBody, PhotoResponse, PhotosListResponse } from "../dto/photo.dto";

@Controller("photos")
@AcController()
@ApiTags("Photo gallery")
export class PhotosController {
  constructor(private photosService: PhotosService) {}

  @Get()
  @AcLinks(PhotosListRoute)
  @ApiResponse({ type: PhotosListResponse, isArray: true })
  async albumsList(@Req() req: Request) {
    return await this.photosService.repository
      .createQueryBuilder("photos")
      .select(["photos.id", "photos.name", "photos.status"])
      .where(PhotosListRoute.canWhere(req))
      .getMany();
  }

  @Post()
  @AcLinks(PhotoCreateRoute)
  @UseInterceptors(FileInterceptor("file"))
  createPhoto(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
  }

  @Get(":id")
  @AcLinks(PhotoReadRoute)
  @ApiResponse({ type: PhotoResponse })
  async albumRead(@Param("id") id: number, @Req() req: Request) {
    const photo = await this.photosService.repository.findOneBy({ id });

    if (!photo) throw new NotFoundException();

    PhotoReadRoute.canOrThrow(req, photo);

    return photo;
  }

  @Patch(":id")
  @AcLinks(PhotoEditRoute)
  @ApiResponse({ status: 204 })
  async albumEdit(@Param("id") id: number, @Req() req: Request, @Body() body: PhotoEditBody): Promise<void> {
    const photo = await this.photosService.repository.findOneBy({ id });

    if (!photo) throw new NotFoundException();

    PhotoEditRoute.canOrThrow(req, photo);

    await this.photosService.updatePhoto(photo.id, body);
  }

  @Delete(":id")
  @AcLinks(PhotoDeleteRoute)
  @ApiResponse({ status: 204 })
  async albumDelete(@Param("id") id: number, @Req() req: Request): Promise<void> {
    const photo = await this.photosService.repository.findOneBy({ id });

    if (!photo) throw new NotFoundException();

    PhotoEditRoute.canOrThrow(req, photo);

    await this.photosService.deletePhoto(photo.id);
  }
}
