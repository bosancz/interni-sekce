import { ApiProperty, ApiPropertyOptional, PartialType, PickType } from "@nestjs/swagger";
import { AcLink } from "src/access-control/access-control-lib/schema/ac-link";
import { Album } from "src/models/albums/entities/album.entity";
import { PhotoFace } from "src/models/albums/entities/photo-face.entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { User } from "src/models/users/entities/user.entity";

export class PhotoLinks {
  @ApiPropertyOptional() "photo:read": AcLink;
}

export class PhotoResponse implements Photo {
  @ApiProperty() id!: number;

  @ApiProperty() albumId!: number;
  @ApiPropertyOptional() album?: Album | undefined;
  @ApiPropertyOptional() uploadedById!: number | null;
  @ApiPropertyOptional() uploadedBy?: User | undefined;
  @ApiPropertyOptional() faces?: PhotoFace[] | undefined;

  @ApiPropertyOptional() title!: string | null;
  @ApiPropertyOptional() name!: string | null;
  @ApiPropertyOptional() caption!: string | null;
  @ApiPropertyOptional() width!: number | null;
  @ApiPropertyOptional() height!: number | null;
  @ApiPropertyOptional() timestamp!: Date | null;
  @ApiPropertyOptional() tags!: string[] | null;
  @ApiPropertyOptional() bg!: string | null;
}

export class PhotosListResponse extends PickType(PhotoResponse, ["id", "name", "title", "albumId"]) {}

export class PhotoEditBody extends PartialType(PhotoResponse) {}
