import { ApiProperty, ApiPropertyOptional, PickType } from "@nestjs/swagger";
import { WithLinks } from "src/access-control/access-control-lib";
import { UserResponse } from "src/api/users/dto/user.dto";
import { Album } from "src/models/albums/entities/album.entity";
import { User } from "src/models/users/entities/user.entity";
import { AlbumResponse } from "./album.dto";

export enum PhotoSizes {
  "big" = "big",
  "small" = "small",
  "original" = "original",
}

export class PhotoResponse {
  @ApiProperty() id!: number;

  @ApiProperty() albumId!: number;
  @ApiProperty({ type: "string" }) timestamp!: string | Date;
  @ApiProperty() name!: string;

  @ApiPropertyOptional({ type: "number" }) width!: number | null;
  @ApiPropertyOptional({ type: "number" }) height!: number | null;
  @ApiPropertyOptional({ type: "number" }) uploadedById!: number | null;
  @ApiPropertyOptional({ type: "string" }) title!: string | null;
  @ApiPropertyOptional({ type: "string" }) caption!: string | null;
  @ApiPropertyOptional({ type: "string", isArray: true }) tags!: string[] | null;
  @ApiPropertyOptional({ type: "string" }) bg!: string | null;

  // @ApiPropertyOptional() faces?: PhotoFace[] | null;
  @ApiPropertyOptional({ type: WithLinks(() => AlbumResponse) }) album?: Album | undefined;
  @ApiPropertyOptional({ type: WithLinks(UserResponse) }) uploadedBy?: User | null;
}

export class PhotoCreateBody extends PickType(PhotoResponse, ["albumId"]) {
  @ApiProperty({ type: "string", format: "binary" }) file!: any;
}

export class PhotoUpdateBody extends PickType(PhotoResponse, ["caption", "tags", "title"]) {}
