import { Pipe, PipeTransform } from "@angular/core";
import { AlbumResponseWithLinks } from "src/app/api";
import { AlbumStatuses } from "src/app/config/album-statuses";

type AlbumPipeProperty = "status";

@Pipe({
  name: "album",
  pure: false,
})
export class AlbumPipe implements PipeTransform {
  defaultProperties: { [property: string]: any } = {};

  constructor() {}

  transform(album: AlbumResponseWithLinks | undefined, property: AlbumPipeProperty): string {
    if (!album) return this.defaultProperties[property];

    switch (property) {
      case "status":
        return AlbumStatuses[album.status]?.name || "?";

      default:
        return "?";
    }
  }
}
