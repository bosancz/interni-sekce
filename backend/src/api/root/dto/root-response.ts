import { ApiProperty } from "@nestjs/swagger";
import { AcLink, AcLinksObject } from "src/access-control/access-control-lib/schema/ac-link";
import { AlbumsController } from "src/api/albums/controllers/albums.controller";
import { PhotosController } from "src/api/albums/controllers/photos.controller";
import { EventsController } from "src/api/events/controllers/events.controller";
import { MembersController } from "src/api/members/controllers/members.controller";

type LinkNames =
  | ExtractExisting<keyof EventsController, "listEvents">
  | ExtractExisting<keyof MembersController, "listMembers">
  | ExtractExisting<keyof AlbumsController, "listAlbums">
  | ExtractExisting<keyof PhotosController, "listPhotos">;

class RootResponseLinks implements AcLinksObject<LinkNames> {
  @ApiProperty({ type: AcLink }) listAlbums!: AcLink;
  @ApiProperty({ type: AcLink }) listPhotos!: AcLink;
  @ApiProperty({ type: AcLink }) listMembers!: AcLink;
  @ApiProperty({ type: AcLink }) listEvents!: AcLink;
}

export class RootResponse {
  @ApiProperty({ type: RootResponseLinks }) _links!: RootResponseLinks;
}
