import { RouteEntity } from "src/access-control/schema/route-entity";
import { Album } from "src/models/albums/entities/album.entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { PhotoReadRoute } from "./photo.acl";

export const AlbumReadRoute = new RouteEntity<Album>({
  permissions: {
    vedouci: true,
  },
});

export const AlbumCreateRoute = new RouteEntity<any, Album>({
  permissions: {
    vedouci: true,
  },
  contains: { entity: AlbumReadRoute },
});

export const AlbumEditRoute = new RouteEntity<Album>({
  permissions: {
    vedouci: true,
  },
  linkTo: AlbumReadRoute,
});

export const AlbumDeleteRoute = new RouteEntity<Album>({
  inheritPermissions: AlbumEditRoute,
  linkTo: AlbumReadRoute,
});

export const AlbumPublishRoute = new RouteEntity<Album>({
  inheritPermissions: AlbumEditRoute,
  condition: (album) => album.status === "draft",
  linkTo: AlbumReadRoute,
});

export const AlbumUnpublishRoute = new RouteEntity<Album>({
  inheritPermissions: AlbumEditRoute,
  condition: (album) => album.status === "public",
  linkTo: AlbumReadRoute,
});

export const AlbumPhotosRoute = new RouteEntity<Album, Photo[]>({
  inheritPermissions: AlbumReadRoute,
  linkTo: AlbumReadRoute,
  contains: {
    array: { entity: PhotoReadRoute },
  },
});
