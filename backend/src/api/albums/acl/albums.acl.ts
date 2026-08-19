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

export const AlbumsDeletedListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: AlbumResponse,

	allowed: {
		vedouci: true,
	},
});

export const AlbumReadPermission = new Permission({
	linkTo: AlbumResponse,
	contains: AlbumResponse,
	params: { albumId: "id" },

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
	params: { albumId: "id" },
	allowed: {
		vedouci: true,
	},
	applicable: ({ doc }) => !doc.deletedAt,
});

export const AlbumDeletePermission = new Permission({
	linkTo: AlbumResponse,
	params: { albumId: "id" },
	allowed: {
		vedouci: ({ doc, req }) => doc.createdById !== null && doc.createdById === req.user?.userId,
	},
	applicable: ({ doc }) => !doc.deletedAt,
});

export const AlbumRestorePermission = new Permission({
	linkTo: AlbumResponse,
	params: { albumId: "id" },
	allowed: {
		vedouci: ({ doc, req }) => doc.createdById !== null && doc.createdById === req.user?.userId,
	},
	applicable: ({ doc }) => !!doc.deletedAt,
});

export const AlbumDeletePermanentPermission = new Permission({
	linkTo: AlbumResponse,
	params: { albumId: "id" },
	allowed: {
		admin: true,
	},
	applicable: ({ doc }) => !!doc.deletedAt,
});

export const AlbumPublishPermission = new Permission({
	linkTo: AlbumResponse,
	params: { albumId: "id" },
	inherit: AlbumEditPermission,
	applicable: ({ doc }) => doc.status === "draft" && !doc.deletedAt,
});

export const AlbumUnpublishPermission = new Permission({
	linkTo: AlbumResponse,
	params: { albumId: "id" },

	inherit: AlbumEditPermission,

	applicable: ({ doc }) => doc.status === "public" && !doc.deletedAt,
});

export const AlbumReorderPhotosPermission = new Permission({
	linkTo: AlbumResponse,
	params: { albumId: "id" },
	inherit: AlbumEditPermission,
});

export const AlbumPhotosPermission = new Permission({
	linkTo: AlbumResponse,
	contains: PhotoResponse,
	params: { albumId: "id" },

	allowed: {
		vedouci: true,
	},
});
