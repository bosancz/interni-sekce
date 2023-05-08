import { ApiProperty } from "@nestjs/swagger";
import { AcLink, AcLinksObject } from "src/access-control/access-control-lib/schema/ac-link";
import { AlbumsController } from "src/api/albums/controllers/albums.controller";
import { PhotosController } from "src/api/albums/controllers/photos.controller";
import { EventsController } from "src/api/events/controllers/events.controller";
import { MembersController } from "src/api/members/controllers/members.controller";

type LinkNames =
  | ExtractExisting<keyof EventsController, "listEvents" | "createEvent">
  | ExtractExisting<keyof MembersController, "listMembers">
  | ExtractExisting<keyof AlbumsController, "listAlbums">
  | ExtractExisting<keyof PhotosController, "listPhotos">;

class RootResponseLinks implements AcLinksObject<LinkNames> {
  @ApiProperty() createEvent!: AcLink;
  @ApiProperty() listAlbums!: AcLink;
  @ApiProperty() listPhotos!: AcLink;
  @ApiProperty() listMembers!: AcLink;
  @ApiProperty() listEvents!: AcLink;
}

export class RootResponse {
  @ApiProperty() version!: string;
  @ApiProperty() environmentTitle!: string;

  @ApiProperty({ type: RootResponseLinks }) _links!: RootResponseLinks;
}
