import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { Photo } from "src/models/albums/entities/photo.entity";
import { PhotoResponse } from "../dto/photo.dto";

export const PhotosListRoute = new RouteACL({
  linkTo: RootResponse,
  contains: PhotoResponse,

  permissions: {
    vedouci: true,
  },
});

export const PhotoReadRoute = new RouteACL({
  linkTo: PhotoResponse,
  contains: PhotoResponse,

  permissions: {
    vedouci: true,
  },
});

export const PhotoCreateRoute = new RouteACL({
  linkTo: RootResponse,

  permissions: {
    vedouci: true,
  },
});

export const PhotoEditRoute = new RouteACL<Photo>({
  linkTo: PhotoResponse,
  permissions: {
    vedouci: true,
  },
});

export const PhotoDeleteRoute = new RouteACL<Photo>({
  linkTo: PhotoResponse,
  inheritPermissions: PhotoEditRoute,
});

export const PhotoReadFileRoute = new RouteACL({
  linkTo: PhotoResponse,
  inheritPermissions: PhotoReadRoute,
});
