import { RouteEntity } from "src/access-control/schema/route-entity";
import { Album } from "src/models/albums/entities/album.entity";
import { AlbumReadRoute } from "./album.acl";

export const AlbumsListRoute = new RouteEntity<undefined, Album[]>({
  permissions: {
    vedouci: true,
    verejnost: true,
  },
  contains: {
    array: { entity: AlbumReadRoute },
  },
});
