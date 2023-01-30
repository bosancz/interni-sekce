import { RouteACL } from "src/access-control/schema/route-acl";
import { Album } from "src/models/albums/entities/album.entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { AlbumResponse } from "../dto/album.dto";
import { PhotoResponse } from "../dto/photo.dto";

export const AlbumsListRoute = new RouteACL<undefined, Album[]>({
  permissions: {
    vedouci: true,
    verejnost: true,
  },
  contains: {
    array: { entity: AlbumResponse },
  },
});

export const AlbumReadRoute = new RouteACL<Album>({
  entity: AlbumResponse,
  permissions: {
    vedouci: true,
  },
});

export const AlbumCreateRoute = new RouteACL<any, Album>({
  entity: AlbumResponse,
  permissions: {
    vedouci: true,
  },
  contains: { entity: AlbumResponse },
});

export const AlbumEditRoute = new RouteACL<Album>({
  entity: AlbumResponse,
  permissions: {
    vedouci: true,
  },
});

export const AlbumDeleteRoute = new RouteACL<Album>({
  entity: AlbumResponse,
  inheritPermissions: AlbumEditRoute,
});

export const AlbumPublishRoute = new RouteACL<Album>({
  entity: AlbumResponse,
  inheritPermissions: AlbumEditRoute,
  condition: (album) => album.status === "draft",
});

export const AlbumUnpublishRoute = new RouteACL<Album>({
  entity: AlbumResponse,
  inheritPermissions: AlbumEditRoute,
  condition: (album) => album.status === "public",
});

export const AlbumPhotosRoute = new RouteACL<Album, Photo[]>({
  entity: AlbumResponse,
  inheritPermissions: AlbumReadRoute,
  contains: {
    array: { entity: PhotoResponse },
  },
});
