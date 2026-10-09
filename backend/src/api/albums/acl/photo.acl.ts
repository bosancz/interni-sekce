import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { PhotoCategoryOfPhotoResponse, PhotoDailyResponse, PhotoExifResponse, PhotoResponse } from "../dto/photo.dto";

export const PhotosListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: PhotoResponse,

	allowed: {
		vedouci: true,
	},
});

export const PhotosBrowsePermission = new Permission<void>({
	linkTo: RootResponse,
	contains: PhotoResponse,

	allowed: {
		vedouci: true,
	},
});

export const PhotoDailyPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: PhotoDailyResponse,

	allowed: {
		vedouci: true,
	},
});

export const PhotoReadPermission = new Permission({
	linkTo: PhotoResponse,
	contains: PhotoResponse,
	params: { photoId: "id" },

	allowed: {
		vedouci: true,
	},
});

export const PhotoCreatePermission = new Permission<void>({
	linkTo: RootResponse,

	allowed: {
		vedouci: true,
	},
});

export const PhotoEditPermission = new Permission({
	linkTo: PhotoResponse,
	params: { photoId: "id" },
	allowed: {
		vedouci: true,
	},
});

export const PhotoDeletePermission = new Permission({
	linkTo: PhotoResponse,
	params: { photoId: "id" },
	inherit: PhotoEditPermission,
});

export const PhotoReadFilePermission = new Permission({
	linkTo: PhotoResponse,
	params: { photoId: "id" },
	inherit: PhotoReadPermission,
});

export const PhotoCategoriesOfPhotoPermission = new Permission({
	linkTo: PhotoResponse,
	contains: PhotoCategoryOfPhotoResponse,
	params: { photoId: "id" },
	inherit: PhotoReadPermission,
});

export const PhotoExifReadPermission = new Permission({
	linkTo: PhotoResponse,
	contains: PhotoExifResponse,
	params: { photoId: "id" },
	inherit: PhotoReadPermission,
});
