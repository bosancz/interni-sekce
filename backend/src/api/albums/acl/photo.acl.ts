import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { PhotoResponse } from "../dto/photo.dto";

export const PhotosListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: PhotoResponse,

	allowed: {
		vedouci: true,
	},
});

export const PhotoReadPermission = new Permission({
	linkTo: PhotoResponse,
	contains: PhotoResponse,

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
	allowed: {
		vedouci: true,
	},
});

export const PhotoDeletePermission = new Permission({
	linkTo: PhotoResponse,
	inherit: PhotoEditPermission,
});

export const PhotoReadFilePermission = new Permission({
	linkTo: PhotoResponse,
	inherit: PhotoReadPermission,
});
