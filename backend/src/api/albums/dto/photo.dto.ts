import { ApiProperty, ApiPropertyOptional, PickType } from "@nestjs/swagger";
import { AcLink, AcLinksObject } from "src/access-control/access-control-lib/schema/ac-link";
import { UserResponse } from "src/api/users/dto/user.dto";
import { Album } from "src/models/albums/entities/album.entity";
import { User } from "src/models/users/entities/user.entity";
import { PhotosController } from "../controllers/photos.controller";
import { AlbumResponse } from "./album.dto";

export enum PhotoSizes {
  "big" = "big",
  "small" = "small",
  "original" = "original",
}

type LinkNames = ExtractExisting<keyof PhotosController, "getPhotoImage">;

class PhotoResponseLinks implements AcLinksObject<LinkNames> {
  @ApiProperty() getPhotoImage!: AcLink;
}

export class PhotoResponse {
  @ApiProperty() id!: number;

  @ApiProperty() albumId!: number;
  @ApiProperty() width!: number;
  @ApiProperty() height!: number;

  @ApiPropertyOptional() uploadedById!: number | null;
  @ApiPropertyOptional() title!: string | null;
  @ApiPropertyOptional() name!: string | null;
  @ApiPropertyOptional() caption!: string | null;
  @ApiPropertyOptional() timestamp!: Date | null;
  @ApiPropertyOptional() tags!: string[] | null;
  @ApiPropertyOptional() bg!: string | null;

  // @ApiPropertyOptional() faces?: PhotoFace[] | null;
  @ApiPropertyOptional({ type: AlbumResponse }) album?: Album | undefined;
  @ApiPropertyOptional({ type: UserResponse }) uploadedBy?: User | null;

  @ApiProperty() _links!: PhotoResponseLinks;
}

export class PhotosListResponse extends PickType(PhotoResponse, ["id", "name", "title", "albumId"]) {}

export class PhotoEditBody extends PickType(PhotoResponse, ["caption", "tags", "title"]) {}
