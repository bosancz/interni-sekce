import { RouteEntity } from "src/access-control/schema/route-entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { PhotoReadRoute } from "./photo.acl";

export const PhotosListRoute = new RouteEntity<undefined, Photo[]>({
  permissions: {
    vedouci: true,
    verejnost: true,
  },
  contains: {
    array: { entity: PhotoReadRoute },
  },
});
