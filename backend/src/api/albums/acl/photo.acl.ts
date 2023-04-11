import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { Photo } from "src/models/albums/entities/photo.entity";
import { PhotoResponse } from "../dto/photo.dto";

export const PhotosListRoute = new RouteACL<undefined, PhotoResponse[]>({
  entity: RootResponse,

  permissions: {
    vedouci: true,
  },
  contains: {
    array: { entity: PhotoResponse },
  },
});

export const PhotoReadRoute = new RouteACL({
  entity: PhotoResponse,
  permissions: {
    vedouci: true,
  },
});

export const PhotoCreateRoute = new RouteACL<undefined, PhotoResponse>({
  permissions: {
    vedouci: true,
  },
});

export const PhotoEditRoute = new RouteACL<Photo>({
  entity: PhotoResponse,
  permissions: {
    vedouci: true,
  },
});

export const PhotoDeleteRoute = new RouteACL<Photo>({
  entity: PhotoResponse,
  inheritPermissions: PhotoEditRoute,
});
