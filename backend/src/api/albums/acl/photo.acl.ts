import { RouteEntity } from "src/access-control/schema/route-entity";
import { Photo } from "src/models/albums/entities/photo.entity";

export const PhotoReadRoute = new RouteEntity<Photo>({
  permissions: {
    vedouci: true,
    verejnost: true,
  },
});

export const PhotoCreateRoute = new RouteEntity<undefined, Photo>({
  permissions: {
    vedouci: true,
  },
});

export const PhotoEditRoute = new RouteEntity<Photo>({
  permissions: {
    vedouci: true,
  },
  linkTo: PhotoReadRoute,
});

export const PhotoDeleteRoute = new RouteEntity<Photo>({
  inheritPermissions: PhotoEditRoute,
  linkTo: PhotoReadRoute,
});
