import { Pipe, PipeTransform } from "@angular/core";
import { AlbumStatuses } from "src/app/config/album-statuses";
import { SDK } from "src/sdk";

type AlbumPipeProperty = "status";

@Pipe({
  name: "album",
  pure: false,
  standalone: false,
})
export class AlbumPipe implements PipeTransform {
  defaultProperties: { [property: string]: any } = {};

  constructor() {}

  transform(album: SDK.AlbumResponseWithLinks | undefined, property: AlbumPipeProperty): string {
    if (!album) return this.defaultProperties[property];

    switch (property) {
      case "status":
        return AlbumStatuses[album.status]?.name || "?";

      default:
        return "?";
    }
  }
}
