import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { Photo } from "src/models/albums/entities/photo.entity";
import { PhotoResponse } from "../dto/photo.dto";

export const PhotosListRoute = new RouteACL<undefined, PhotoResponse[]>({
  linkEntity: RootResponse,

  permissions: {
    vedouci: true,
  },
  contains: {
    array: { entity: PhotoResponse },
  },
});

export const PhotoReadRoute = new RouteACL({
  linkEntity: PhotoResponse,
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
  linkEntity: PhotoResponse,
  permissions: {
    vedouci: true,
  },
});

export const PhotoDeleteRoute = new RouteACL<Photo>({
  linkEntity: PhotoResponse,
  inheritPermissions: PhotoEditRoute,
});

export const PhotoReadFileRoute = new RouteACL({
  linkEntity: PhotoResponse,
  inheritPermissions: PhotoReadRoute,
});
