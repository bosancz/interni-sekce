import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { AlbumResponse } from "../dto/album.dto";
import { PhotoResponse } from "../dto/photo.dto";

export const AlbumsListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: AlbumResponse,

	allowed: {
		vedouci: true,
	},
});

export const AlbumsYearsPermission = new Permission<void>({
	linkTo: RootResponse,
	inherit: AlbumsListPermission,
});

export const AlbumReadPermission = new Permission({
	linkTo: AlbumResponse,
	allowed: {
		vedouci: true,
	},
});

export const AlbumCreatePermission = new Permission<void>({
	linkTo: RootResponse,

	allowed: {
		vedouci: true,
	},
	contains: AlbumResponse,
});

export const AlbumEditPermission = new Permission({
	linkTo: AlbumResponse,
	allowed: {
		vedouci: true,
	},
});

export const AlbumDeletePermission = new Permission({
	linkTo: AlbumResponse,
	inherit: AlbumEditPermission,
});

export const AlbumPublishPermission = new Permission({
	linkTo: AlbumResponse,
	inherit: AlbumEditPermission,
	applicable: (album) => album.status === "draft",
});

export const AlbumUnpublishPermission = new Permission({
	linkTo: AlbumResponse,

	inherit: AlbumEditPermission,

	applicable: (album) => album.status === "public",
});

export const AlbumPhotosPermission = new Permission({
	linkTo: AlbumResponse,
	contains: PhotoResponse,

	allowed: {
		vedouci: true,
	},
});
