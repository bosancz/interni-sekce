import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { Album } from "src/models/albums/entities/album.entity";
import { AlbumResponse } from "../dto/album.dto";
import { PhotoResponse } from "../dto/photo.dto";

export const AlbumsListRoute = new RouteACL({
  linkTo: RootResponse,
  contains: AlbumResponse,

  permissions: {
    vedouci: true,
  },
});

export const AlbumReadRoute = new RouteACL<Album>({
  linkTo: AlbumResponse,
  permissions: {
    vedouci: true,
  },
});

export const AlbumCreateRoute = new RouteACL({
  linkTo: RootResponse,

  permissions: {
    vedouci: true,
  },
  contains: AlbumResponse,
});

export const AlbumEditRoute = new RouteACL<Album>({
  linkTo: AlbumResponse,
  permissions: {
    vedouci: true,
  },
});

export const AlbumDeleteRoute = new RouteACL<Album>({
  linkTo: AlbumResponse,
  inheritPermissions: AlbumEditRoute,
});

export const AlbumPublishRoute = new RouteACL<Album>({
  linkTo: AlbumResponse,
  inheritPermissions: AlbumEditRoute,
  condition: (album) => album.status === "draft",
});

export const AlbumUnpublishRoute = new RouteACL<Album>({
  linkTo: AlbumResponse,

  inheritPermissions: AlbumEditRoute,

  condition: (album) => album.status === "public",
});

export const AlbumPhotosRoute = new RouteACL<Album>({
  linkTo: AlbumResponse,
  contains: PhotoResponse,

  permissions: {
    vedouci: true,
  },
});
