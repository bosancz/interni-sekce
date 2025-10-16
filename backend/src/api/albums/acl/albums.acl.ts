import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { AlbumResponse } from "../dto/album.dto";
import { PhotoResponse } from "../dto/photo.dto";

export const AlbumsListRoute = new Permission<void>({
	linkTo: RootResponse,
	contains: AlbumResponse,

	allowed: {
		vedouci: true,
	},
});

export const AlbumsYearsRoute = new Permission<void>({
	linkTo: RootResponse,
	inherit: AlbumsListRoute,
});

export const AlbumReadRoute = new Permission({
	linkTo: AlbumResponse,
	allowed: {
		vedouci: true,
	},
});

export const AlbumCreateRoute = new Permission<void>({
	linkTo: RootResponse,

	allowed: {
		vedouci: true,
	},
	contains: AlbumResponse,
});

export const AlbumEditRoute = new Permission({
	linkTo: AlbumResponse,
	allowed: {
		vedouci: true,
	},
});

export const AlbumDeleteRoute = new Permission({
	linkTo: AlbumResponse,
	inherit: AlbumEditRoute,
});

export const AlbumPublishRoute = new Permission({
	linkTo: AlbumResponse,
	inherit: AlbumEditRoute,
	applicable: (album) => album.status === "draft",
});

export const AlbumUnpublishRoute = new Permission({
	linkTo: AlbumResponse,

	inherit: AlbumEditRoute,

	applicable: (album) => album.status === "public",
});

export const AlbumPhotosRoute = new Permission({
	linkTo: AlbumResponse,
	contains: PhotoResponse,

	allowed: {
		vedouci: true,
	},
});
